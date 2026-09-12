const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkOrder = sequelize.define('WorkOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  location_id: { type: DataTypes.INTEGER, allowNull: false },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  required_qty: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  available_at_location: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  shortage_qty: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  assigned_user_id: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('Assigned', 'InProgress', 'Completed'),
    allowNull: false,
    defaultValue: 'Assigned',
  },
  notes: { type: DataTypes.TEXT },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = WorkOrder;
