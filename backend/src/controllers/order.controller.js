const { CustomerOrderModel, InventoryModel, InventoryTxModel } = require('../models');
const { transaction } = require('../config/database');

const createOrder = (req, res) => {
  try {
    const { item_id, location_id, quantity, customer_name, notes } = req.body;
    if (!item_id || !location_id || !quantity) {
      return res.status(400).json({ success: false, message: 'item_id, location_id, quantity are required' });
    }
    if (parseFloat(quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }

    const result = transaction(() => {
      // Lock and check inventory (SQLite serializes transactions — race condition safe)
      const invRecords = InventoryModel.findByItemAndLocation(parseInt(item_id), parseInt(location_id));
      if (!invRecords.length) throw { status: 400, message: 'No inventory found for this item at this location' };

      const totalAvailable = invRecords.reduce((s, r) => s + (r.physical_qty - r.reserved_qty), 0);
      if (parseFloat(quantity) > totalAvailable) {
        throw { status: 400, message: `Insufficient available stock. Available: ${totalAvailable}, Requested: ${quantity}` };
      }

      // Reserve (greedy across batches)
      let remaining = parseFloat(quantity);
      const txLogs = [];
      for (const inv of invRecords) {
        if (remaining <= 0) break;
        const available = inv.physical_qty - inv.reserved_qty;
        const reserve = Math.min(available, remaining);
        if (reserve <= 0) continue;
        InventoryModel.updateReserved(inv.id, inv.reserved_qty + reserve);
        txLogs.push({ inv_id: inv.id, reserve });
        remaining -= reserve;
      }

      // Create order
      const order = CustomerOrderModel.create({
        item_id: parseInt(item_id),
        location_id: parseInt(location_id),
        quantity: parseFloat(quantity),
        customer_name, notes,
        created_by: req.user.id,
        status: 'Confirmed',
      });

      // Log transactions
      for (const { inv_id, reserve } of txLogs) {
        InventoryTxModel.create({
          inventory_id: inv_id, type: 'RESERVE', quantity: reserve,
          reference_type: 'order', reference_id: order.id,
          note: `Reserved for Customer Order #${order.id}`, created_by: req.user.id,
        });
      }

      return order;
    });

    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getOrders = (req, res) => {
  try {
    const { status } = req.query;
    return res.json({ success: true, data: CustomerOrderModel.findAll({ status }) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const cancelOrder = (req, res) => {
  try {
    const result = transaction(() => {
      const order = CustomerOrderModel.findRaw(parseInt(req.params.id));
      if (!order) throw { status: 404, message: 'Order not found' };
      if (order.status === 'Cancelled') throw { status: 400, message: 'Order is already cancelled' };

      // Release reserved stock
      const invRecords = InventoryModel.findByItemAndLocation(order.item_id, order.location_id);
      let remaining = order.quantity;
      for (const inv of invRecords) {
        if (remaining <= 0) break;
        const release = Math.min(inv.reserved_qty, remaining);
        if (release <= 0) continue;
        InventoryModel.updateReserved(inv.id, inv.reserved_qty - release);
        InventoryTxModel.create({
          inventory_id: inv.id, type: 'RELEASE', quantity: release,
          reference_type: 'order', reference_id: order.id,
          note: `Released from cancelled Customer Order #${order.id}`, created_by: req.user.id,
        });
        remaining -= release;
      }

      return CustomerOrderModel.updateStatus(order.id, 'Cancelled');
    });

    return res.json({ success: true, message: 'Order cancelled and stock released', data: result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createOrder, getOrders, cancelOrder };
