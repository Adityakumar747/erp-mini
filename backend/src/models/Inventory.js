const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  location_id: { type: DataTypes.INTEGER, allowNull: false },
  batch: { type: DataTypes.STRING, allowNull: false, defaultValue: 'DEFAULT' },
  physical_qty: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  reserved_qty: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  // available_qty is computed: physical_qty - reserved_qty
}, {
  indexes: [
    { unique: true, fields: ['item_id', 'location_id', 'batch'] }
  ],
});

module.exports = Inventory;
