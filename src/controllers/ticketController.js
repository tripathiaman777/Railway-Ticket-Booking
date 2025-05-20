import { body, param, validationResult } from 'express-validator';
import * as ticketService from '../services/ticketService.js';
import logger from '../config/logger.js';
import { GENDER } from '../utils/constants.js';

export const bookTicketValidation = [
  body('passengers')
    .isArray({ min: 1 })
    .withMessage('At least one passenger is required'),
  body('passengers.*.name')
    .notEmpty()
    .withMessage('Passenger name is required')
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  body('passengers.*.age')
    .notEmpty()
    .withMessage('Age is required')
    .isInt({ min: 0, max: 120 })
    .withMessage('Age must be between 0 and 120'),
  body('passengers.*.gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(Object.values(GENDER))
    .withMessage('Gender must be MALE, FEMALE, or OTHER'),
  body('passengers.*.hasChildren')
    .optional()
    .isBoolean()
    .withMessage('hasChildren must be a boolean')
];

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
  param('ticketId')
    .isInt({ min: 1 })
    .withMessage('Invalid ticket ID')
];

export const cancelTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ticketId } = req.params;
    const result = await ticketService.cancelTicket(ticketId);
    
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