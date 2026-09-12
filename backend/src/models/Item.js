const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Item = sequelize.define('Item', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  unit: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pcs' },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = Item;
