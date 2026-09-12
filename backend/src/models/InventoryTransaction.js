const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryTransaction = sequelize.define('InventoryTransaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  inventory_id: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM('IN', 'OUT', 'RESERVE', 'RELEASE'),
    allowNull: false,
  },
  quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  reference_type: { type: DataTypes.STRING }, // 'transfer', 'order', 'manual'
  reference_id: { type: DataTypes.INTEGER },
  note: { type: DataTypes.STRING },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = InventoryTransaction;
