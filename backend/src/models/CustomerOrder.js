const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomerOrder = sequelize.define('CustomerOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  location_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('Pending', 'Confirmed', 'Cancelled'),
    allowNull: false,
    defaultValue: 'Pending',
  },
  customer_name: { type: DataTypes.STRING },
  notes: { type: DataTypes.STRING },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = CustomerOrder;
