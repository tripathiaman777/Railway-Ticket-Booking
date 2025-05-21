import { getConnection } from '../config/database.js';
import * as berthModel from '../models/Berth.js';
import * as ticketModel from '../models/Ticket.js';
import * as passengerModel from '../models/Passenger.js';
import logger from '../config/logger.js';
import {
  TICKET_STATUS,
  PASSENGER_STATUS,
  BERTH_STATUS,
  LIMITS
} from '../utils/constants.js';

export const bookTicket = async (passengers) => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Filter out children under 5 (they don't need a seat)
    const seatRequiredPassengers = passengers.filter(p => p.age >= LIMITS.CHILD_AGE);

    // Get current counts
    const confirmedCount = await passengerModel.getConfirmedCount();
    const racCount = await passengerModel.getRACCount();
    const waitingListCount = await passengerModel.getWaitingListCount();

    // Calculate available slots
    const confirmedAvailable = LIMITS.CONFIRMED_BERTHS - confirmedCount;
    const racAvailable = LIMITS.RAC_PASSENGERS - racCount;
    const waitingAvailable = LIMITS.WAITING_LIST - waitingListCount;
    const totalAvailable = confirmedAvailable + racAvailable + waitingAvailable;

    if (seatRequiredPassengers.length > totalAvailable) {
      return {
        status: 400,
        message: `Not enough seats. Available: Confirmed=${confirmedAvailable}, RAC=${racAvailable}, Waiting List=${waitingAvailable}`
      };
    }

    // Sort passengers to allocate berths in priority order
    const sortedPassengers = [...passengers].sort((a, b) => {
      // Priority for senior citizens (age 60+)
      if (a.age >= LIMITS.SENIOR_AGE && b.age < LIMITS.SENIOR_AGE) return -1;
      if (b.age >= LIMITS.SENIOR_AGE && a.age < LIMITS.SENIOR_AGE) return 1;
      // Priority for ladies with children
      if (a.hasChildren && a.gender === 'FEMALE' && (!b.hasChildren || b.gender !== 'FEMALE')) return -1;
      if (b.hasChildren && b.gender === 'FEMALE' && (!a.hasChildren || a.gender !== 'FEMALE')) return 1;
      return 0;
    });

    let ticketStatus = TICKET_STATUS.CONFIRMED;
    const ticket = await ticketModel.createTicket(ticketStatus);
    let nextWaitingListNumber = waitingListCount + 1;

    for (const passenger of sortedPassengers) {
      // Children under 5 don't get a berth
      if (passenger.age < LIMITS.CHILD_AGE) {
        await passengerModel.createPassenger(
          ticket.id,
          passenger.name,
          passenger.age,
          passenger.gender,
          null,
          null,
          PASSENGER_STATUS.NO_BERTH,
          null
        );
        continue;
      }

      let berth = null;
      let status = PASSENGER_STATUS.CONFIRMED;
      let berthPosition = null;
      let waitingListNumber = null;

      // Priority for lower berth
      if (passenger.age >= LIMITS.SENIOR_AGE || (passenger.hasChildren && passenger.gender === 'FEMALE')) {
        berth = await berthModel.findAvailableLowerBerth();
      }
      if (!berth || berth.length === 0) {
        berth = await berthModel.findAvailableBerth();
      }

      if (berth && berth.length > 0) {
        berth = berth[0];
        await berthModel.updateBerthStatus(berth.id, BERTH_STATUS.BOOKED);
      } else {
        // Try RAC if no confirmed berth available
        const racBerth = await berthModel.findAvailableRAC();
        if (racBerth && racBerth.length > 0) {
          berth = racBerth[0];
          status = PASSENGER_STATUS.RAC;
          berthPosition = (racBerth[0].passengers_count || 0) + 1;
          if (berthPosition === 1) {
            await berthModel.updateBerthStatus(berth.id, BERTH_STATUS.RAC);
          }
        } else {
          // Put in waiting list if no RAC available
          if (nextWaitingListNumber > LIMITS.WAITING_LIST) {
            throw new Error('No tickets available. Waiting list is full.');
          }
          if (ticketStatus === TICKET_STATUS.CONFIRMED || ticketStatus === TICKET_STATUS.RAC) {
            ticketStatus = TICKET_STATUS.WAITING_LIST;
            await ticketModel.updateTicketStatus(ticket.id, ticketStatus);
          }
          status = PASSENGER_STATUS.WAITING_LIST;
          waitingListNumber = nextWaitingListNumber;
          nextWaitingListNumber++;
        }
      }

      await passengerModel.createPassenger(
        ticket.id,
        passenger.name,
        passenger.age,
        passenger.gender,
        berth ? berth.id : null,
        berthPosition ?? null,
        status,
        waitingListNumber ?? null
      );
    }

    await connection.commit();
    const bookedTicket = await getTicketDetails(ticket.id);
    return bookedTicket;

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const cancelTicket = async (pnr) => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    const ticket = await ticketModel.getTicketByPNR(pnr);
    const ticketId = ticket.id;
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.status === TICKET_STATUS.CANCELLED) throw new Error('Ticket is already cancelled');

    const passengers = await passengerModel.getPassengersByTicketId(ticketId);

    await ticketModel.updateTicketStatus(ticketId, TICKET_STATUS.CANCELLED);
    await passengerModel.cancelPassengersByTicketId(ticketId);

    // Free all confirmed berths
    for (const passenger of passengers) {
      if (passenger.status === PASSENGER_STATUS.CONFIRMED && passenger.berth_id) {
        await berthModel.updateBerthStatus(passenger.berth_id, BERTH_STATUS.AVAILABLE);
      }
    }

    // Promote as many RAC passengers as possible to confirmed
    while (await promoteNextRACPassenger()) {}
    // Promote as many waiting list passengers as possible to confirmed
    while (await promoteNextWaitingListToConfirmedPassenger()) {}
    // Promote as many waiting list passengers as possible to RAC
    while (await promoteNextWaitingListPassenger()) {}

    await passengerModel.updateWaitingListNumbers();

    await connection.commit();
    return { message: 'Ticket cancelled successfully', pnr: ticket.pnr };

  } catch (error) {
    await connection.rollback();
    logger.error(`Error cancelling ticket: ${error.message}`, { error });
    throw error;
  } finally {
    connection.release();
  }
};

const promoteNextRACPassenger = async () => {
  const nextRAC = await passengerModel.getNextRAC();
  if (!nextRAC) return false;

  const availableBerth = await berthModel.findAvailableBerth();
  if (!availableBerth || availableBerth.length === 0) {
    logger.error('Logic error: No available berth found for RAC promotion');
    return false;
  }

  await passengerModel.updatePassengerStatus(
    nextRAC.id,
    PASSENGER_STATUS.CONFIRMED,
    availableBerth[0].id,
    null,
    null
  );
  await berthModel.updateBerthStatus(availableBerth[0].id, BERTH_STATUS.BOOKED);

  if (nextRAC.berth_id) {
    const otherRACPassengers = await passengerModel.getRACCount();
    if (otherRACPassengers === 0) {
      await berthModel.updateBerthStatus(nextRAC.berth_id, BERTH_STATUS.AVAILABLE);
    }
  }

  const ticketPassengers = await passengerModel.getPassengersByTicketId(nextRAC.ticket_id);
  const allConfirmed = ticketPassengers.every(p =>
    p.status === PASSENGER_STATUS.CONFIRMED || p.status === PASSENGER_STATUS.NO_BERTH
  );
  if (allConfirmed) {
    await ticketModel.updateTicketStatus(nextRAC.ticket_id, TICKET_STATUS.CONFIRMED);
  }

  return true;
};

const promoteNextWaitingListPassenger = async () => {
  const nextWL = await passengerModel.getNextWaitingList();
  if (!nextWL) return false;

  const availableRAC = await berthModel.findAvailableRAC();
  if (!availableRAC || availableRAC.length === 0) {
    logger.error('Logic error: No available RAC berth found for waiting list promotion');
    return false;
  }

  const berthPosition = (availableRAC[0].passengers_count || 0) + 1;

  await passengerModel.updatePassengerStatus(
    nextWL.id,
    PASSENGER_STATUS.RAC,
    availableRAC[0].id,
    berthPosition,
    null
  );

  if (berthPosition === 1) {
    await berthModel.updateBerthStatus(availableRAC[0].id, BERTH_STATUS.RAC);
  }

  await passengerModel.updateWaitingListNumbers();

  const ticketPassengers = await passengerModel.getPassengersByTicketId(nextWL.ticket_id);
  const allConfirmedOrRAC = ticketPassengers.every(p =>
    p.status === PASSENGER_STATUS.CONFIRMED ||
    p.status === PASSENGER_STATUS.RAC ||
    p.status === PASSENGER_STATUS.NO_BERTH
  );
  if (allConfirmedOrRAC) {
    const hasRAC = ticketPassengers.some(p => p.status === PASSENGER_STATUS.RAC);
    const newStatus = hasRAC ? TICKET_STATUS.RAC : TICKET_STATUS.CONFIRMED;
    await ticketModel.updateTicketStatus(nextWL.ticket_id, newStatus);
  }

  return true;
};

const promoteNextWaitingListToConfirmedPassenger = async () => {
  const nextWL = await passengerModel.getNextWaitingList();
  if (!nextWL) return false;

  const availableBerth = await berthModel.findAvailableBerth();
  if (!availableBerth || availableBerth.length === 0) return false;

  await passengerModel.updatePassengerStatus(
    nextWL.id,
    PASSENGER_STATUS.CONFIRMED,
    availableBerth[0].id,
    null,
    null
  );
  await berthModel.updateBerthStatus(availableBerth[0].id, BERTH_STATUS.BOOKED);

  await passengerModel.updateWaitingListNumbers();

  const ticketPassengers = await passengerModel.getPassengersByTicketId(nextWL.ticket_id);
  const allConfirmed = ticketPassengers.every(p =>
    p.status === PASSENGER_STATUS.CONFIRMED || p.status === PASSENGER_STATUS.NO_BERTH
  );
  if (allConfirmed) {
    await ticketModel.updateTicketStatus(nextWL.ticket_id, TICKET_STATUS.CONFIRMED);
  }

  return true;
};

export const getTicketDetails = async (ticketId) => {
  const ticket = await ticketModel.getTicketById(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  const passengers = await passengerModel.getPassengersByTicketId(ticketId);
  return { ...ticket, passengers };
};

export const getBookedTickets = async () => {
  return await ticketModel.getBookedTickets();
};

export const getAvailableTickets = async () => {
  const [stats] = await berthModel.getBerthStatistics();
  const availableBerths = await berthModel.getAvailableBerths();

  return {
    summary: {
      available_confirmed: stats.available_confirmed,
      booked_confirmed: stats.booked_confirmed,
      rac_passengers: stats.rac_passengers,
      available_rac: LIMITS.RAC_PASSENGERS - stats.rac_passengers,
      waiting_list_passengers: stats.waiting_list_passengers,
      available_waiting_list: LIMITS.WAITING_LIST - stats.waiting_list_passengers
    },
    available_berths: availableBerths
  };
};