const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { createWorkOrder, getWorkOrders, getWorkOrderById, updateWorkOrderStatus } = require('../controllers/workorder.controller');

/**
 * @swagger
 * tags:
 *   name: WorkOrders
 *   description: Work order management
 */

/**
 * @swagger
 * /api/work-orders:
 *   get:
 *     tags: [WorkOrders]
 *     summary: List all work orders
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Assigned, InProgress, Completed] }
 *     responses:
 *       200:
 *         description: Work orders list
 */
router.get('/', auth, authorize('admin', 'operations'), getWorkOrders);

/**
 * @swagger
 * /api/work-orders/{id}:
 *   get:
 *     tags: [WorkOrders]
 *     summary: Get work order by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Work order detail
 */
router.get('/:id', auth, authorize('admin', 'operations'), getWorkOrderById);

/**
 * @swagger
 * /api/work-orders:
 *   post:
 *     tags: [WorkOrders]
 *     summary: Create work order (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [location_id, item_id, required_qty, assigned_user_id]
 *             properties:
 *               location_id: { type: integer }
 *               item_id: { type: integer }
 *               required_qty: { type: number }
 *               assigned_user_id: { type: integer }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Work order created with shortage calculated
 *       403:
 *         description: Unauthorized
 */
router.post('/', auth, authorize('admin'), createWorkOrder);

/**
 * @swagger
 * /api/work-orders/{id}/status:
 *   patch:
 *     tags: [WorkOrders]
 *     summary: Update work order status (Admin or Operations)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Assigned, InProgress, Completed] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', auth, authorize('admin', 'operations'), updateWorkOrderStatus);

module.exports = router;
