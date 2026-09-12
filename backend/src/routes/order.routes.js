const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { createOrder, getOrders, cancelOrder } = require('../controllers/order.controller');

/**
 * @swagger
 * tags:
 *   name: CustomerOrders
 *   description: Customer order and stock reservation
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [CustomerOrders]
 *     summary: List all customer orders
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pending, Confirmed, Cancelled] }
 *     responses:
 *       200:
 *         description: Orders list
 */
router.get('/', auth, authorize('admin', 'sales'), getOrders);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [CustomerOrders]
 *     summary: Create order and atomically reserve stock (Sales)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item_id, location_id, quantity]
 *             properties:
 *               item_id: { type: integer }
 *               location_id: { type: integer }
 *               quantity: { type: number }
 *               customer_name: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Order created and stock reserved
 *       400:
 *         description: Insufficient stock
 */
router.post('/', auth, authorize('admin', 'sales'), createOrder);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     tags: [CustomerOrders]
 *     summary: Cancel order and release reserved stock
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cancelled and stock released
 */
router.patch('/:id/cancel', auth, authorize('admin', 'sales'), cancelOrder);

module.exports = router;
