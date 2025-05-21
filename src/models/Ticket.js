import { executeQuery, getConnection } from '../config/database.js';
import { TICKET_STATUS, generatePNR } from '../utils/constants.js';

export const createTicket = async (status) => {
  const pnr = generatePNR();
  const sql = `INSERT INTO tickets (pnr, status) VALUES (?, ?)`;
  const result = await executeQuery(sql, [pnr, status]);
  return {
    id: result.insertId,
    pnr
  };
};

export const updateTicketStatus = async (ticketId, status) => {
  const sql = `UPDATE tickets SET status = ? WHERE id = ?`;
  return await executeQuery(sql, [status, ticketId]);
};

export const getTicketByPNR = async (pnr) => {
  const sql = `SELECT id FROM tickets WHERE pnr = ?`;
  const results = await executeQuery(sql, [pnr]);
  return results.length > 0 ? results[0] : null;
};

export const getTicketById = async (id) => {
  const sql = `SELECT * FROM tickets WHERE id = ?`;
  const results = await executeQuery(sql, [id]);
  return results.length > 0 ? results[0] : null;
};

export const getBookedTickets = async () => {
  const sql = `
    SELECT 
      t.id as ticket_id,
      t.pnr,
      t.status as ticket_status,
      t.booking_date,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', p.id,
          'name', p.name,
          'age', p.age,
          'gender', p.gender,
          'status', p.status,
          'berth_number', b.berth_number,
          'berth_type', b.berth_type,
          'berth_position', p.berth_position,
          'waiting_list_number', p.waiting_list_number
        )
      ) as passengers
    FROM tickets t
    JOIN passengers p ON t.id = p.ticket_id
    LEFT JOIN berths b ON p.berth_id = b.id
    WHERE t.status != 'CANCELLED'
    GROUP BY t.id, t.pnr, t.status, t.booking_date
    ORDER BY t.booking_date DESC
  `;
  return await executeQuery(sql);
};