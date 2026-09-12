/**
 * All SQL query helpers (replaces Sequelize ORM)
 * Uses Node.js built-in node:sqlite
 */
const { getDb } = require('../config/database');

// ─── Users ────────────────────────────────────────────────────────────────────
const UserModel = {
  findByEmail: (email) => getDb().prepare('SELECT * FROM users WHERE email = ?').get(email),
  findById: (id) => getDb().prepare('SELECT id, name, email, role, createdAt FROM users WHERE id = ?').get(id),
  create: (data) => {
    const stmt = getDb().prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)'
    );
    const r = stmt.run(data.name, data.email, data.password_hash, data.role);
    return { id: Number(r.lastInsertRowid), ...data };
  },
  findAll: () => getDb().prepare('SELECT id, name, email, role, createdAt FROM users').all(),
};

// ─── Locations ────────────────────────────────────────────────────────────────
const LocationModel = {
  findAll: () => getDb().prepare('SELECT * FROM locations ORDER BY name').all(),
  findById: (id) => getDb().prepare('SELECT * FROM locations WHERE id = ?').get(id),
  create: (data) => {
    const r = getDb().prepare('INSERT INTO locations (name, address) VALUES (?,?)').run(data.name, data.address || null);
    return { id: Number(r.lastInsertRowid), ...data };
  },
};

// ─── Categories ───────────────────────────────────────────────────────────────
const CategoryModel = {
  findAll: () => getDb().prepare('SELECT * FROM categories').all(),
  findById: (id) => getDb().prepare('SELECT * FROM categories WHERE id = ?').get(id),
  create: (data) => {
    const r = getDb().prepare('INSERT INTO categories (name) VALUES (?)').run(data.name);
    return { id: Number(r.lastInsertRowid), ...data };
  },
};

// ─── Items ────────────────────────────────────────────────────────────────────
const ItemModel = {
  findAll: () => getDb().prepare(`
    SELECT i.*, c.name as category_name FROM items i
    LEFT JOIN categories c ON c.id = i.category_id
    ORDER BY i.name
  `).all(),
  findById: (id) => getDb().prepare(`
    SELECT i.*, c.name as category_name FROM items i
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE i.id = ?
  `).get(id),
  create: (data) => {
    const r = getDb().prepare('INSERT INTO items (name, unit, category_id) VALUES (?,?,?)').run(data.name, data.unit, data.category_id);
    return { id: Number(r.lastInsertRowid), ...data };
  },
};

// ─── Inventory ────────────────────────────────────────────────────────────────
const InventoryModel = {
  findAll: (filters = {}) => {
    let sql = `
      SELECT inv.*,
        (inv.physical_qty - inv.reserved_qty) as available_qty,
        i.name as item_name, i.unit as item_unit,
        c.name as category_name,
        l.name as location_name
      FROM inventory inv
      LEFT JOIN items i ON i.id = inv.item_id
      LEFT JOIN categories c ON c.id = i.category_id
      LEFT JOIN locations l ON l.id = inv.location_id
      WHERE 1=1
    `;
    const params = [];
    if (filters.location_id) { sql += ' AND inv.location_id = ?'; params.push(filters.location_id); }
    if (filters.item_id) { sql += ' AND inv.item_id = ?'; params.push(filters.item_id); }
    sql += ' ORDER BY inv.id';
    return getDb().prepare(sql).all(...params);
  },
  findById: (id) => {
    const inv = getDb().prepare(`
      SELECT inv.*,
        (inv.physical_qty - inv.reserved_qty) as available_qty,
        i.name as item_name, i.unit as item_unit,
        l.name as location_name
      FROM inventory inv
      LEFT JOIN items i ON i.id = inv.item_id
      LEFT JOIN locations l ON l.id = inv.location_id
      WHERE inv.id = ?
    `).get(id);
    if (!inv) return null;
    const transactions = getDb().prepare(`
      SELECT t.*, u.name as created_by_name FROM inventory_transactions t
      LEFT JOIN users u ON u.id = t.created_by
      WHERE t.inventory_id = ? ORDER BY t.createdAt DESC
    `).all(id);
    return { ...inv, transactions };
  },
  findByItemAndLocation: (item_id, location_id) =>
    getDb().prepare('SELECT * FROM inventory WHERE item_id = ? AND location_id = ?').all(item_id, location_id),
  findOrCreate: (item_id, location_id, batch = 'DEFAULT') => {
    const db = getDb();
    let record = db.prepare('SELECT * FROM inventory WHERE item_id = ? AND location_id = ? AND batch = ?').get(item_id, location_id, batch);
    if (!record) {
      const r = db.prepare('INSERT INTO inventory (item_id, location_id, batch, physical_qty, reserved_qty) VALUES (?,?,?,0,0)').run(item_id, location_id, batch);
      record = db.prepare('SELECT * FROM inventory WHERE id = ?').get(Number(r.lastInsertRowid));
    }
    return record;
  },
  updatePhysical: (id, physical_qty) => {
    getDb().prepare('UPDATE inventory SET physical_qty = ?, updatedAt = datetime(\'now\') WHERE id = ?').run(physical_qty, id);
  },
  updateReserved: (id, reserved_qty) => {
    getDb().prepare('UPDATE inventory SET reserved_qty = ?, updatedAt = datetime(\'now\') WHERE id = ?').run(reserved_qty, id);
  },
};

// ─── Inventory Transactions ───────────────────────────────────────────────────
const InventoryTxModel = {
  create: (data) => {
    const r = getDb().prepare(`
      INSERT INTO inventory_transactions (inventory_id, type, quantity, reference_type, reference_id, note, created_by)
      VALUES (?,?,?,?,?,?,?)
    `).run(data.inventory_id, data.type, data.quantity, data.reference_type || null, data.reference_id || null, data.note || null, data.created_by);
    return { id: Number(r.lastInsertRowid), ...data };
  },
};

// ─── Work Orders ──────────────────────────────────────────────────────────────
const WorkOrderModel = {
  create: (data) => {
    const r = getDb().prepare(`
      INSERT INTO work_orders (location_id, item_id, required_qty, available_at_location, shortage_qty, assigned_user_id, status, notes, created_by)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(data.location_id, data.item_id, data.required_qty, data.available_at_location, data.shortage_qty,
           data.assigned_user_id, data.status || 'Assigned', data.notes || null, data.created_by);
    return WorkOrderModel.findById(Number(r.lastInsertRowid));
  },
  findById: (id) => getDb().prepare(`
    SELECT wo.*,
      l.name as location_name,
      i.name as item_name, i.unit as item_unit,
      u1.name as assigned_user_name, u1.role as assigned_user_role,
      u2.name as created_by_name
    FROM work_orders wo
    LEFT JOIN locations l ON l.id = wo.location_id
    LEFT JOIN items i ON i.id = wo.item_id
    LEFT JOIN users u1 ON u1.id = wo.assigned_user_id
    LEFT JOIN users u2 ON u2.id = wo.created_by
    WHERE wo.id = ?
  `).get(id),
  findAll: (filters = {}) => {
    let sql = `
      SELECT wo.*,
        l.name as location_name,
        i.name as item_name, i.unit as item_unit,
        u1.name as assigned_user_name, u1.role as assigned_user_role,
        u2.name as created_by_name
      FROM work_orders wo
      LEFT JOIN locations l ON l.id = wo.location_id
      LEFT JOIN items i ON i.id = wo.item_id
      LEFT JOIN users u1 ON u1.id = wo.assigned_user_id
      LEFT JOIN users u2 ON u2.id = wo.created_by
      WHERE 1=1
    `;
    const params = [];
    if (filters.status) { sql += ' AND wo.status = ?'; params.push(filters.status); }
    if (filters.location_id) { sql += ' AND wo.location_id = ?'; params.push(filters.location_id); }
    sql += ' ORDER BY wo.createdAt DESC';
    return getDb().prepare(sql).all(...params);
  },
  updateStatus: (id, status) => {
    getDb().prepare('UPDATE work_orders SET status = ?, updatedAt = datetime(\'now\') WHERE id = ?').run(status, id);
    return WorkOrderModel.findById(id);
  },
};

// ─── Transfers ────────────────────────────────────────────────────────────────
const TransferModel = {
  create: (data) => {
    const r = getDb().prepare(`
      INSERT INTO transfers (source_location_id, dest_location_id, item_id, quantity, status, work_order_id, notes, created_by)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(data.source_location_id, data.dest_location_id, data.item_id, data.quantity,
           'Requested', data.work_order_id || null, data.notes || null, data.created_by);
    return TransferModel.findById(Number(r.lastInsertRowid));
  },
  findById: (id) => getDb().prepare(`
    SELECT t.*,
      ls.name as source_location_name,
      ld.name as dest_location_name,
      i.name as item_name, i.unit as item_unit,
      u.name as created_by_name
    FROM transfers t
    LEFT JOIN locations ls ON ls.id = t.source_location_id
    LEFT JOIN locations ld ON ld.id = t.dest_location_id
    LEFT JOIN items i ON i.id = t.item_id
    LEFT JOIN users u ON u.id = t.created_by
    WHERE t.id = ?
  `).get(id),
  findRaw: (id) => getDb().prepare('SELECT * FROM transfers WHERE id = ?').get(id),
  findAll: (filters = {}) => {
    let sql = `
      SELECT t.*,
        ls.name as source_location_name,
        ld.name as dest_location_name,
        i.name as item_name, i.unit as item_unit,
        u.name as created_by_name
      FROM transfers t
      LEFT JOIN locations ls ON ls.id = t.source_location_id
      LEFT JOIN locations ld ON ld.id = t.dest_location_id
      LEFT JOIN items i ON i.id = t.item_id
      LEFT JOIN users u ON u.id = t.created_by
      WHERE 1=1
    `;
    const params = [];
    if (filters.status) { sql += ' AND t.status = ?'; params.push(filters.status); }
    sql += ' ORDER BY t.createdAt DESC';
    return getDb().prepare(sql).all(...params);
  },
  updateStatus: (id, status, extra = {}) => {
    const db = getDb();
    const now = new Date().toISOString();
    if (status === 'Dispatched') {
      db.prepare('UPDATE transfers SET status = ?, dispatched_at = ?, updatedAt = ? WHERE id = ?').run(status, now, now, id);
    } else if (status === 'Received') {
      db.prepare('UPDATE transfers SET status = ?, received_at = ?, updatedAt = ? WHERE id = ?').run(status, now, now, id);
    } else {
      db.prepare('UPDATE transfers SET status = ?, updatedAt = ? WHERE id = ?').run(status, now, id);
    }
    return TransferModel.findById(id);
  },
};

// ─── Customer Orders ──────────────────────────────────────────────────────────
const CustomerOrderModel = {
  create: (data) => {
    const r = getDb().prepare(`
      INSERT INTO customer_orders (item_id, location_id, quantity, status, customer_name, notes, created_by)
      VALUES (?,?,?,?,?,?,?)
    `).run(data.item_id, data.location_id, data.quantity, data.status || 'Confirmed',
           data.customer_name || null, data.notes || null, data.created_by);
    return CustomerOrderModel.findById(Number(r.lastInsertRowid));
  },
  findById: (id) => getDb().prepare(`
    SELECT co.*,
      i.name as item_name, i.unit as item_unit,
      l.name as location_name,
      u.name as created_by_name
    FROM customer_orders co
    LEFT JOIN items i ON i.id = co.item_id
    LEFT JOIN locations l ON l.id = co.location_id
    LEFT JOIN users u ON u.id = co.created_by
    WHERE co.id = ?
  `).get(id),
  findRaw: (id) => getDb().prepare('SELECT * FROM customer_orders WHERE id = ?').get(id),
  findAll: (filters = {}) => {
    let sql = `
      SELECT co.*,
        i.name as item_name, i.unit as item_unit,
        l.name as location_name,
        u.name as created_by_name
      FROM customer_orders co
      LEFT JOIN items i ON i.id = co.item_id
      LEFT JOIN locations l ON l.id = co.location_id
      LEFT JOIN users u ON u.id = co.created_by
      WHERE 1=1
    `;
    const params = [];
    if (filters.status) { sql += ' AND co.status = ?'; params.push(filters.status); }
    sql += ' ORDER BY co.createdAt DESC';
    return getDb().prepare(sql).all(...params);
  },
  updateStatus: (id, status) => {
    getDb().prepare('UPDATE customer_orders SET status = ?, updatedAt = datetime(\'now\') WHERE id = ?').run(status, id);
    return CustomerOrderModel.findById(id);
  },
};

module.exports = {
  UserModel, LocationModel, CategoryModel, ItemModel,
  InventoryModel, InventoryTxModel,
  WorkOrderModel, TransferModel, CustomerOrderModel,
};
