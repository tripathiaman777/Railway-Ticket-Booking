import express from 'express';
import * as ticketController from '../controllers/ticketController.js';
import { bookTicketValidation } from '../validations/bookTickets.js';
import { joiValidate } from '../middlewares/joiValidate.js';

const router = express.Router();

// Book a ticket



/**
 * @swagger
 * /api/v1/ticket/book:
 *   post:
 *     summary: Book a ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     age:
 *                       type: integer
 *                     gender:
 *                       type: string
 *                     hasChildren:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Ticket booked successfully
 */
router.post(
  '/book', 
  joiValidate(bookTicketValidation),
  ticketController.bookTicket
);

// Cancel a ticket
/**
 * @swagger
 * /api/v1/ticket/cancel/{pnr}:
 *   post:
 *     summary: Cancel a ticket by ticketId
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The PNR of the ticket to cancel
 *     responses:
 *       200:
 *         description: Ticket cancelled successfully
 *       404:
 *         description: Ticket not found or already cancelled
 */
router.post(
  '/cancel/:pnr', 
  ticketController.cancelTicketValidation,
  ticketController.cancelTicket
);

// Get all booked tickets
/**
 * @swagger
 * /api/v1/ticket/booked:
 *   get:
 *     summary: Get all booked tickets
 *     responses:
 *       200:
 *         description: Returns all booked tickets
 */
router.get('/booked', ticketController.getBookedTickets);

// Get available tickets
/**
 * @swagger
 * /api/v1/ticket/available:
 *   get:
 *     summary: Get available tickets and berths
 *     responses:
 *       200:
 *         description: Returns available confirmed, RAC, and waiting list tickets
 */
router.get('/available', ticketController.getAvailableTickets);

export default router;