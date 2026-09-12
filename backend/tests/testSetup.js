/**
 * Test helper: creates an in-memory SQLite DB, syncs tables, seeds minimal data
 */
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const bcrypt = require('bcryptjs');
const { initDb, closeDb, getDb } = require('../src/config/database');
const { UserModel, LocationModel, CategoryModel, ItemModel, InventoryModel } = require('../src/models');

let seededData = {};

async function setupTestDB() {
  initDb();
  const db = getDb();

  // Clear in proper foreign-key safe order
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
  const admin = UserModel.create({ name: 'Admin', email: 'admin@test.com', password_hash: bcrypt.hashSync('admin123', salt), role: 'admin' });
  const ops = UserModel.create({ name: 'Ops', email: 'ops@test.com', password_hash: bcrypt.hashSync('ops123', salt), role: 'operations' });
  const sales = UserModel.create({ name: 'Sales', email: 'sales@test.com', password_hash: bcrypt.hashSync('sales123', salt), role: 'sales' });

  const locA = LocationModel.create({ name: 'Location A', address: 'Addr A' });
  const locB = LocationModel.create({ name: 'Location B', address: 'Addr B' });

  const cat = CategoryModel.create({ name: 'TestCat' });
  const item = ItemModel.create({ name: 'Test Item', unit: 'pcs', category_id: cat.id });

  const r = db.prepare('INSERT INTO inventory (item_id, location_id, batch, physical_qty, reserved_qty) VALUES (?,?,?,?,?)')
    .run(item.id, locA.id, 'TEST-BATCH', 100, 0);
  const inv = db.prepare('SELECT * FROM inventory WHERE id = ?').get(Number(r.lastInsertRowid));

  seededData = { admin, ops, sales, locA, locB, cat, item, inv };
  return seededData;
}

async function teardownTestDB() {
  closeDb();
}

module.exports = { setupTestDB, teardownTestDB, getSeededData: () => seededData };
