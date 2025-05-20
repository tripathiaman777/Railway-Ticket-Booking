import mysql from 'mysql2/promise';
import logger from './logger.js';
import dotenv from 'dotenv';

console.log('Database configuration loaded');
// Load environment variables
dotenv.config();

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const executeQuery = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    logger.error(`Database error: ${error.message}`, { sql, params, error });
    throw error;
  }
};

export const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    logger.error(`Connection error: ${error.message}`, { error });
    throw error;
  }
};

export { pool };