const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { getInventory, getInventoryById, addStock, getItems, getLocations } = require('../controllers/inventory.controller');

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management
 */

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: List all inventory with available_qty
 *     parameters:
 *       - in: query
 *         name: location_id
 *         schema: { type: integer }
 *       - in: query
 *         name: item_id
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Inventory list
 */
router.get('/', auth, getInventory);

/**
 * @swagger
 * /api/inventory/items:
 *   get:
 *     tags: [Inventory]
 *     summary: List all items
 *     responses:
 *       200:
 *         description: Items list
 */
router.get('/items', auth, getItems);

/**
 * @swagger
 * /api/inventory/locations:
 *   get:
 *     tags: [Inventory]
 *     summary: List all locations
 *     responses:
 *       200:
 *         description: Locations list
 */
router.get('/locations', auth, getLocations);

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get inventory by ID with transaction history
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Inventory detail
 *       404:
 *         description: Not found
 */
router.get('/:id', auth, getInventoryById);

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     tags: [Inventory]
 *     summary: Add or adjust stock (Admin or Operations)
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
 *               batch: { type: string }
 *               quantity: { type: number }
 *               note: { type: string }
 *     responses:
 *       201:
 *         description: Stock added
 */
router.post('/', auth, authorize('admin', 'operations'), addStock);

module.exports = router;
