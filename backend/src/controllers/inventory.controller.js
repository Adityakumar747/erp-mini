const { InventoryModel, InventoryTxModel, ItemModel, LocationModel } = require('../models');
const { transaction } = require('../config/database');

const getInventory = (req, res) => {
  try {
    const { location_id, item_id } = req.query;
    const data = InventoryModel.findAll({
      location_id: location_id ? parseInt(location_id) : undefined,
      item_id: item_id ? parseInt(item_id) : undefined,
    });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getInventoryById = (req, res) => {
  try {
    const record = InventoryModel.findById(parseInt(req.params.id));
    if (!record) return res.status(404).json({ success: false, message: 'Inventory not found' });
    return res.json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const addStock = (req, res) => {
  try {
    const { item_id, location_id, batch = 'DEFAULT', quantity, note } = req.body;
    if (!item_id || !location_id || !quantity) {
      return res.status(400).json({ success: false, message: 'item_id, location_id, quantity are required' });
    }
    if (parseFloat(quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }

    const result = transaction(() => {
      const inv = InventoryModel.findOrCreate(parseInt(item_id), parseInt(location_id), batch);
      const newQty = inv.physical_qty + parseFloat(quantity);
      InventoryModel.updatePhysical(inv.id, newQty);

      InventoryTxModel.create({
        inventory_id: inv.id,
        type: 'IN',
        quantity: parseFloat(quantity),
        reference_type: 'manual',
        note: note || 'Manual stock addition',
        created_by: req.user.id,
      });

      return { ...inv, physical_qty: newQty, available_qty: newQty - inv.reserved_qty };
    });

    return res.status(201).json({ success: true, message: 'Stock added successfully', data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getItems = (req, res) => {
  try {
    return res.json({ success: true, data: ItemModel.findAll() });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getLocations = (req, res) => {
  try {
    return res.json({ success: true, data: LocationModel.findAll() });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getInventory, getInventoryById, addStock, getItems, getLocations };
