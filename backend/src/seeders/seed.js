require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initDb, getDb } = require('../config/database');
const { UserModel, LocationModel, CategoryModel, ItemModel, InventoryModel } = require('../models');

function seed() {
  initDb();
  const db = getDb();

  // Clear in order (foreign key safe)
  db.exec(`
    DELETE FROM inventory_transactions;
    DELETE FROM customer_orders;
    DELETE FROM transfers;
    DELETE FROM work_orders;
    DELETE FROM inventory;
    DELETE FROM items;
    DELETE FROM categories;
    DELETE FROM locations;
    DELETE FROM users;
  `);

  const salt = bcrypt.genSaltSync(10);
  const users = [
    UserModel.create({ name: 'Admin User', email: 'admin@erp.com', password_hash: bcrypt.hashSync('admin123', salt), role: 'admin' }),
    UserModel.create({ name: 'Operations User', email: 'ops@erp.com', password_hash: bcrypt.hashSync('ops123', salt), role: 'operations' }),
    UserModel.create({ name: 'Sales User', email: 'sales@erp.com', password_hash: bcrypt.hashSync('sales123', salt), role: 'sales' }),
  ];
  console.log('✅ Users created');

  const locations = [
    LocationModel.create({ name: 'Warehouse A', address: '12 Industrial Ave, Mumbai' }),
    LocationModel.create({ name: 'Warehouse B', address: '45 Trade Zone, Delhi' }),
    LocationModel.create({ name: 'Store C', address: '8 Commerce St, Pune' }),
  ];
  console.log('✅ Locations created');

  const cats = [
    CategoryModel.create({ name: 'Electronics' }),
    CategoryModel.create({ name: 'Raw Materials' }),
    CategoryModel.create({ name: 'Finished Goods' }),
  ];

  const items = [
    ItemModel.create({ name: 'Circuit Board A', unit: 'pcs', category_id: cats[0].id }),
    ItemModel.create({ name: 'Steel Rod 10mm', unit: 'kg', category_id: cats[1].id }),
    ItemModel.create({ name: 'Copper Wire 2m', unit: 'roll', category_id: cats[1].id }),
    ItemModel.create({ name: 'Assembled Motor', unit: 'pcs', category_id: cats[2].id }),
    ItemModel.create({ name: 'Power Adapter 12V', unit: 'pcs', category_id: cats[0].id }),
  ];
  console.log('✅ Items created');

  // Inventory at each location
  const invData = [
    { item_id: items[0].id, location_id: locations[0].id, batch: 'BATCH-A01', physical_qty: 200, reserved_qty: 0 },
    { item_id: items[1].id, location_id: locations[0].id, batch: 'BATCH-A02', physical_qty: 500, reserved_qty: 0 },
    { item_id: items[2].id, location_id: locations[0].id, batch: 'BATCH-A03', physical_qty: 100, reserved_qty: 0 },
    { item_id: items[0].id, location_id: locations[1].id, batch: 'BATCH-B01', physical_qty: 150, reserved_qty: 0 },
    { item_id: items[3].id, location_id: locations[1].id, batch: 'BATCH-B02', physical_qty: 80, reserved_qty: 0 },
    { item_id: items[4].id, location_id: locations[1].id, batch: 'BATCH-B03', physical_qty: 60, reserved_qty: 0 },
    { item_id: items[3].id, location_id: locations[2].id, batch: 'BATCH-C01', physical_qty: 30, reserved_qty: 0 },
    { item_id: items[4].id, location_id: locations[2].id, batch: 'BATCH-C02', physical_qty: 40, reserved_qty: 0 },
  ];
  for (const d of invData) {
    db.prepare('INSERT INTO inventory (item_id, location_id, batch, physical_qty, reserved_qty) VALUES (?,?,?,?,?)').run(d.item_id, d.location_id, d.batch, d.physical_qty, d.reserved_qty);
  }
  console.log('✅ Inventory seeded');

  console.log('\n🎉 Seed complete!');
  console.log('  Admin:      admin@erp.com / admin123');
  console.log('  Operations: ops@erp.com   / ops123');
  console.log('  Sales:      sales@erp.com / sales123');
}

seed();
