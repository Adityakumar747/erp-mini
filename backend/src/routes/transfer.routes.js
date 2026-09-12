const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { createTransfer, getTransfers, dispatchTransfer, receiveTransfer } = require('../controllers/transfer.controller');

/**
 * @swagger
 * tags:
 *   name: Transfers
 *   description: Internal stock transfer management
 */

/**
 * @swagger
 * /api/transfers:
 *   get:
 *     tags: [Transfers]
 *     summary: List all transfers
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Requested, Dispatched, Received] }
 *     responses:
 *       200:
 *         description: Transfers list
 */
router.get('/', auth, authorize('admin', 'operations'), getTransfers);

/**
 * @swagger
 * /api/transfers:
 *   post:
 *     tags: [Transfers]
 *     summary: Request a new stock transfer (Operations)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [source_location_id, dest_location_id, item_id, quantity]
 *             properties:
 *               source_location_id: { type: integer }
 *               dest_location_id: { type: integer }
 *               item_id: { type: integer }
 *               quantity: { type: number }
 *               work_order_id: { type: integer }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Transfer created
 */
router.post('/', auth, authorize('admin', 'operations'), createTransfer);

/**
 * @swagger
 * /api/transfers/{id}/dispatch:
 *   patch:
 *     tags: [Transfers]
 *     summary: Dispatch transfer — reduces source inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Dispatched
 *       400:
 *         description: Insufficient stock or invalid state
 */
router.patch('/:id/dispatch', auth, authorize('admin', 'operations'), dispatchTransfer);

/**
 * @swagger
 * /api/transfers/{id}/receive:
 *   patch:
 *     tags: [Transfers]
 *     summary: Receive transfer — increases destination inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Received
 *       409:
 *         description: Already received
 */
router.patch('/:id/receive', auth, authorize('admin', 'operations'), receiveTransfer);

module.exports = router;
