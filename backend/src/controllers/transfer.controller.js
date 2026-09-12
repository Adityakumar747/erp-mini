const { TransferModel, InventoryModel, InventoryTxModel } = require('../models');
const { transaction } = require('../config/database');

const createTransfer = (req, res) => {
  try {
    const { source_location_id, dest_location_id, item_id, quantity, work_order_id, notes } = req.body;
    if (!source_location_id || !dest_location_id || !item_id || !quantity) {
      return res.status(400).json({ success: false, message: 'source_location_id, dest_location_id, item_id, quantity are required' });
    }
    if (parseFloat(quantity) <= 0) return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    if (parseInt(source_location_id) === parseInt(dest_location_id)) {
      return res.status(400).json({ success: false, message: 'Source and destination must differ' });
    }

    const transfer = TransferModel.create({
      source_location_id: parseInt(source_location_id),
      dest_location_id: parseInt(dest_location_id),
      item_id: parseInt(item_id),
      quantity: parseFloat(quantity),
      work_order_id: work_order_id ? parseInt(work_order_id) : null,
      notes,
      created_by: req.user.id,
    });

    return res.status(201).json({ success: true, data: transfer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getTransfers = (req, res) => {
  try {
    const { status } = req.query;
    return res.json({ success: true, data: TransferModel.findAll({ status }) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const dispatchTransfer = (req, res) => {
  try {
    const result = transaction(() => {
      const transfer = TransferModel.findRaw(parseInt(req.params.id));
      if (!transfer) throw { status: 404, message: 'Transfer not found' };
      if (transfer.status !== 'Requested') throw { status: 400, message: `Transfer is already ${transfer.status}` };

      const srcRecords = InventoryModel.findByItemAndLocation(transfer.item_id, transfer.source_location_id);
      const totalAvailable = srcRecords.reduce((s, r) => s + (r.physical_qty - r.reserved_qty), 0);

      if (totalAvailable < transfer.quantity) {
        throw { status: 400, message: `Insufficient stock at source. Available: ${totalAvailable}, Required: ${transfer.quantity}` };
      }

      // Deduct from source (greedy across batches)
      let remaining = transfer.quantity;
      for (const inv of srcRecords) {
        if (remaining <= 0) break;
        const available = inv.physical_qty - inv.reserved_qty;
        const deduct = Math.min(available, remaining);
        if (deduct <= 0) continue;
        InventoryModel.updatePhysical(inv.id, inv.physical_qty - deduct);
        InventoryTxModel.create({
          inventory_id: inv.id, type: 'OUT', quantity: deduct,
          reference_type: 'transfer', reference_id: transfer.id,
          note: `Dispatched via Transfer #${transfer.id}`, created_by: req.user.id,
        });
        remaining -= deduct;
      }

      return TransferModel.updateStatus(transfer.id, 'Dispatched');
    });

    return res.json({ success: true, message: 'Transfer dispatched. Source inventory reduced.', data: result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const receiveTransfer = (req, res) => {
  try {
    const result = transaction(() => {
      const transfer = TransferModel.findRaw(parseInt(req.params.id));
      if (!transfer) throw { status: 404, message: 'Transfer not found' };

      // Idempotency guard — check received_at timestamp
      if (transfer.received_at !== null && transfer.received_at !== undefined) {
        throw { status: 409, message: 'Transfer has already been received' };
      }
      if (transfer.status === 'Received') {
        throw { status: 409, message: 'Transfer has already been received' };
      }
      if (transfer.status !== 'Dispatched') {
        throw { status: 400, message: 'Transfer must be Dispatched before receiving' };
      }

      // Increase destination inventory
      const destInv = InventoryModel.findOrCreate(transfer.item_id, transfer.dest_location_id, 'DEFAULT');
      InventoryModel.updatePhysical(destInv.id, destInv.physical_qty + transfer.quantity);

      InventoryTxModel.create({
        inventory_id: destInv.id, type: 'IN', quantity: transfer.quantity,
        reference_type: 'transfer', reference_id: transfer.id,
        note: `Received via Transfer #${transfer.id}`, created_by: req.user.id,
      });

      return TransferModel.updateStatus(transfer.id, 'Received');
    });

    return res.json({ success: true, message: 'Transfer received. Destination inventory updated.', data: result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createTransfer, getTransfers, dispatchTransfer, receiveTransfer };
