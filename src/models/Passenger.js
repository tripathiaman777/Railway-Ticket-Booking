import { executeQuery } from '../config/database.js';
import { PASSENGER_STATUS } from '../utils/constants.js';

export const createPassenger = async (
  ticketId, 
  name, 
  age, 
  gender, 
  berthId, 
  berthPosition, 
  status,
  waitingListNumber = null
) => {
  const sql = `
    INSERT INTO passengers 
    (ticket_id, name, age, gender, berth_id, berth_position, status, waiting_list_number) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  // Convert undefined to null for all params
  const params = [
    ticketId ?? null,
    name ?? null,
    age ?? null,
    gender ?? null,
    berthId ?? null,
    berthPosition ?? null,
    status ?? null,
    waitingListNumber ?? null
  ];

  const result = await executeQuery(sql, params);
  return result.insertId;
};

export const updatePassengerStatus = async (passengerId, status, berthId = null, berthPosition = null, waitingListNumber = null) => {
  let sql = `UPDATE passengers SET status = ?`;
  let params = [status];
  
  if (berthId !== null) {
    sql += `, berth_id = ?`;
    params.push(berthId);
  }
  
  if (berthPosition !== null) {
    sql += `, berth_position = ?`;
    params.push(berthPosition);
  }
  
  if (waitingListNumber !== null) {
    sql += `, waiting_list_number = ?`;
    params.push(waitingListNumber);
  }
  
  sql += ` WHERE id = ?`;
  params.push(passengerId);
  
  return await executeQuery(sql, params);
};

export const getNextRAC = async () => {
  const sql = `
    SELECT p.*, t.id as ticket_id, t.pnr
    FROM passengers p
    JOIN tickets t ON p.ticket_id = t.id
    WHERE p.status = ? 
    ORDER BY p.id ASC
    LIMIT 1
  `;
  
  const results = await executeQuery(sql, [PASSENGER_STATUS.RAC]);
  return results.length > 0 ? results[0] : null;
};

export const getNextWaitingList = async () => {
  const sql = `
    SELECT p.*, t.id as ticket_id, t.pnr
    FROM passengers p
    JOIN tickets t ON p.ticket_id = t.id
    WHERE p.status = ? 
    ORDER BY p.waiting_list_number ASC
    LIMIT 1
  `;
  
  const results = await executeQuery(sql, [PASSENGER_STATUS.WAITING_LIST]);
  return results.length > 0 ? results[0] : null;
};

export const getPassengersByTicketId = async (ticketId) => {
  const sql = `
    SELECT p.*, b.berth_number, b.berth_type
    FROM passengers p
    LEFT JOIN berths b ON p.berth_id = b.id
    WHERE p.ticket_id = ?
  `;
  
  return await executeQuery(sql, [ticketId]);
};

export const updateWaitingListNumbers = async () => {
  // MySQL does not support multiple statements by default, so this may need adjustment depending on your config.
  // If not supported, you may need to run these as separate queries.
  const setVarSql = `SET @wl_num := 0;`;
  const updateSql = `
    UPDATE passengers 
    SET waiting_list_number = (@wl_num := @wl_num + 1)
    WHERE status = 'WAITING_LIST' 
    ORDER BY id;
  `;
  await executeQuery(setVarSql);
  return await executeQuery(updateSql);
};

export const getWaitingListCount = async () => {
  const sql = `SELECT COUNT(*) as count FROM passengers WHERE status = ?`;
  const result = await executeQuery(sql, [PASSENGER_STATUS.WAITING_LIST]);
  return result[0].count;
};

export const getRACCount = async () => {
  const sql = `SELECT COUNT(*) as count FROM passengers WHERE status = ?`;
  const result = await executeQuery(sql, [PASSENGER_STATUS.RAC]);
  return result[0].count;
};

export const cancelPassengersByTicketId = async (ticketId) => {
  const sql = `UPDATE passengers SET status = 'CANCELLED' WHERE ticket_id = ?`;
  return await executeQuery(sql, [ticketId]);
};

export const getConfirmedCount = async () => {
  const sql = `SELECT COUNT(*) as count FROM passengers WHERE status = 'CONFIRMED'`;
  const result = await executeQuery(sql);
  return result[0].count;
};