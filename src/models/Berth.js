import { executeQuery } from '../config/database.js';
import { BERTH_STATUS, BERTH_TYPES } from '../utils/constants.js';

export const findAvailableBerth = async () => {
  const sql = `
    SELECT id, berth_number, berth_type 
    FROM berths 
    WHERE status = 'AVAILABLE' AND berth_type IN ('LOWER', 'MIDDLE', 'UPPER')
    ORDER BY berth_number 
    LIMIT 1
  `;
  return await executeQuery(sql);
};

export const findAvailableLowerBerth = async () => {
  const sql = `
    SELECT id, berth_number, berth_type 
    FROM berths 
    WHERE status = 'AVAILABLE' AND berth_type = 'LOWER'
    ORDER BY berth_number 
    LIMIT 1
  `;
  return await executeQuery(sql);
};

export const findAvailableRAC = async () => {
  const sql = `
    SELECT b.id, b.berth_number, b.berth_type, COUNT(p.id) as passengers_count
    FROM berths b
    LEFT JOIN passengers p ON b.id = p.berth_id AND p.status = 'RAC'
    WHERE b.berth_type = 'SIDE_LOWER' AND (b.status = 'AVAILABLE' OR b.status = 'RAC')
    GROUP BY b.id, b.berth_number, b.berth_type
    HAVING passengers_count < 2
    ORDER BY passengers_count ASC, b.berth_number
    LIMIT 1
  `;
  return await executeQuery(sql);
};

export const updateBerthStatus = async (berthId, status) => {
  const sql = `UPDATE berths SET status = ? WHERE id = ?`;
  return await executeQuery(sql, [status, berthId]);
};

export const getBerthStatistics = async () => {
  const sql = `
    SELECT 
      SUM(CASE WHEN status = 'AVAILABLE' AND berth_type IN ('LOWER', 'MIDDLE', 'UPPER') THEN 1 ELSE 0 END) as available_confirmed,
      SUM(CASE WHEN status = 'BOOKED' AND berth_type IN ('LOWER', 'MIDDLE', 'UPPER') THEN 1 ELSE 0 END) as booked_confirmed,
      (SELECT COUNT(*) FROM passengers WHERE status = 'RAC') as rac_passengers,
      (SELECT COUNT(*) FROM passengers WHERE status = 'WAITING_LIST') as waiting_list_passengers
    FROM berths
  `;
  return await executeQuery(sql);
};

export const getAvailableBerths = async () => {
  const sql = `
    SELECT id, berth_number, berth_type
    FROM berths
    WHERE status = 'AVAILABLE' AND berth_type IN ('LOWER', 'MIDDLE', 'UPPER')
    ORDER BY berth_number
  `;
  return await executeQuery(sql);
};

