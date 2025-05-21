import { body, param, validationResult } from 'express-validator';
import * as ticketService from '../services/ticketService.js';
import logger from '../config/logger.js';


export const bookTicket = async (req, res) => {
  try {
    console.log('Booking ticket request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { passengers } = req.body;
    const ticket = await ticketService.bookTicket(passengers);
    
    return res.status(201).json({
      message: 'Ticket booked successfully',
      ticket
    });
  } catch (error) {
    logger.error(`Error booking ticket: ${error.message}`, { error });
    
    if (error.message.includes('No tickets available')) {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const cancelTicketValidation = [
  param('pnr')
    .isString()
    .isLength({ min: 1, max: 20 })
    .withMessage('PNR must be a string of max length 20')
];
export const cancelTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pnr } = req.params;
    console.log('Cancelling ticket request:', pnr);
    const result = await ticketService.cancelTicket(pnr);
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error cancelling ticket: ${error.message}`, { error });
    
    if (error.message.includes('Ticket not found') || error.message.includes('already cancelled')) {
      return res.status(404).json({ message: error.message });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBookedTickets = async (req, res) => {
  try {
    const tickets = await ticketService.getBookedTickets();
    
    return res.status(200).json({
      count: tickets.length,
      tickets
    });
  } catch (error) {
    logger.error(`Error getting booked tickets: ${error.message}`, { error });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAvailableTickets = async (req, res) => {
  try {
    const ticketInfo = await ticketService.getAvailableTickets();
    
    return res.status(200).json(ticketInfo);
  } catch (error) {
    logger.error(`Error getting available tickets: ${error.message}`, { error });
    return res.status(500).json({ message: 'Internal server error' });
  }
};