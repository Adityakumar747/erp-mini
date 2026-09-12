const { WorkOrderModel, InventoryModel, UserModel } = require('../models');

const createWorkOrder = (req, res) => {
  try {
    const { location_id, item_id, required_qty, assigned_user_id, notes } = req.body;
    if (!location_id || !item_id || !required_qty || !assigned_user_id) {
      return res.status(400).json({ success: false, message: 'location_id, item_id, required_qty, assigned_user_id are required' });
    }
    if (parseFloat(required_qty) <= 0) {
      return res.status(400).json({ success: false, message: 'required_qty must be positive' });
    }

    const assignedUser = UserModel.findById(parseInt(assigned_user_id));
    if (!assignedUser) return res.status(400).json({ success: false, message: 'Assigned user not found' });

    // Calculate shortage
    const invRecords = InventoryModel.findByItemAndLocation(parseInt(item_id), parseInt(location_id));
    const totalPhysical = invRecords.reduce((s, r) => s + r.physical_qty, 0);
    const totalReserved = invRecords.reduce((s, r) => s + r.reserved_qty, 0);
    const availableAtLocation = totalPhysical - totalReserved;
    const shortage = Math.max(0, parseFloat(required_qty) - availableAtLocation);

    const wo = WorkOrderModel.create({
      location_id: parseInt(location_id),
      item_id: parseInt(item_id),
      required_qty: parseFloat(required_qty),
      available_at_location: availableAtLocation,
      shortage_qty: shortage,
      assigned_user_id: parseInt(assigned_user_id),
      notes,
      created_by: req.user.id,
    });

    return res.status(201).json({ success: true, data: wo });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getWorkOrders = (req, res) => {
  try {
    const { status, location_id } = req.query;
    const data = WorkOrderModel.findAll({
      status,
      location_id: location_id ? parseInt(location_id) : undefined,
    });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getWorkOrderById = (req, res) => {
  try {
    const wo = WorkOrderModel.findById(parseInt(req.params.id));
    if (!wo) return res.status(404).json({ success: false, message: 'Work order not found' });
    return res.json({ success: true, data: wo });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateWorkOrderStatus = (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Assigned', 'InProgress', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }
    const wo = WorkOrderModel.findById(parseInt(req.params.id));
    if (!wo) return res.status(404).json({ success: false, message: 'Work order not found' });

    const updated = WorkOrderModel.updateStatus(parseInt(req.params.id), status);
    return res.json({ success: true, message: 'Status updated', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createWorkOrder, getWorkOrders, getWorkOrderById, updateWorkOrderStatus };
