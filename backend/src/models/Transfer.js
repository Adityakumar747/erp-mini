const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transfer = sequelize.define('Transfer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  source_location_id: { type: DataTypes.INTEGER, allowNull: false },
  dest_location_id: { type: DataTypes.INTEGER, allowNull: false },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('Requested', 'Dispatched', 'Received'),
    allowNull: false,
    defaultValue: 'Requested',
  },
  work_order_id: { type: DataTypes.INTEGER, allowNull: true },
  dispatched_at: { type: DataTypes.DATE, allowNull: true },
  received_at: { type: DataTypes.DATE, allowNull: true }, // idempotency guard
  notes: { type: DataTypes.STRING },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = Transfer;
