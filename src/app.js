import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import rootRoute from './routes/rootRoute.js';
import { pool } from './config/database.js';
import swaggerUi from "swagger-ui-express";
import swaggerSpec from './config/swagger.js';

// Load environment variables
dotenv.config();

const app = express();

// Test DB connection on startup
pool.getConnection()
  .then(connection => {
    logger.info('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    logger.error('Database connection failed', { error: err });
    process.exit(1); // Exit if DB connection fails
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/v1', rootRoute);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { error: err });
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});