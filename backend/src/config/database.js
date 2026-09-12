/**
 * Database layer using Node.js built-in node:sqlite (Node 22.5+)
 * No native compilation required — ships with Node 24
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_STORAGE || path.join(__dirname, '../../database.sqlite');
const isMemory = dbPath === ':memory:' || process.env.NODE_ENV === 'test';

let _db = null;

function getDb() {
  if (!_db) {
    _db = new DatabaseSync(isMemory ? ':memory:' : dbPath);
    // Enable WAL mode for better concurrency, foreign keys
    _db.exec('PRAGMA journal_mode = WAL;');
    _db.exec('PRAGMA foreign_keys = ON;');
  }
  return _db;
}

function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
  }
}

/**
 * Run a transaction with automatic commit/rollback
 */
function transaction(fn) {
  const db = getDb();
  db.exec('BEGIN');
  try {
    const result = fn(db);
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/**
 * Initializes all database tables
 */
function initDb() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','operations','sales')),
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      address TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'pcs',
      category_id INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      batch TEXT NOT NULL DEFAULT 'DEFAULT',
      physical_qty REAL NOT NULL DEFAULT 0,
      reserved_qty REAL NOT NULL DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      UNIQUE(item_id, location_id, batch),
      FOREIGN KEY(item_id) REFERENCES items(id),
      FOREIGN KEY(location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('IN','OUT','RESERVE','RELEASE')),
      quantity REAL NOT NULL,
      reference_type TEXT,
      reference_id INTEGER,
      note TEXT,
      created_by INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(inventory_id) REFERENCES inventory(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      required_qty REAL NOT NULL,
      available_at_location REAL DEFAULT 0,
      shortage_qty REAL DEFAULT 0,
      assigned_user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Assigned' CHECK(status IN ('Assigned','InProgress','Completed')),
      notes TEXT,
      created_by INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(location_id) REFERENCES locations(id),
      FOREIGN KEY(item_id) REFERENCES items(id),
      FOREIGN KEY(assigned_user_id) REFERENCES users(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_location_id INTEGER NOT NULL,
      dest_location_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Requested' CHECK(status IN ('Requested','Dispatched','Received')),
      work_order_id INTEGER,
      notes TEXT,
      dispatched_at TEXT,
      received_at TEXT,
      created_by INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(source_location_id) REFERENCES locations(id),
      FOREIGN KEY(dest_location_id) REFERENCES locations(id),
      FOREIGN KEY(item_id) REFERENCES items(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS customer_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Confirmed' CHECK(status IN ('Pending','Confirmed','Cancelled')),
      customer_name TEXT,
      notes TEXT,
      created_by INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(item_id) REFERENCES items(id),
      FOREIGN KEY(location_id) REFERENCES locations(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );
  `);
  console.log('✅ Database tables initialized');
}

module.exports = { getDb, closeDb, transaction, initDb };
