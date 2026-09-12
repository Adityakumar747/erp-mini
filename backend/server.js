require('dotenv').config();
const app = require('./src/app');
const { initDb, getDb } = require('./src/config/database');
const bcrypt = require('bcryptjs');
const { UserModel, LocationModel, CategoryModel, ItemModel, InventoryModel } = require('./src/models');

const PORT = process.env.PORT || 5000;

function autoSeed() {
  initDb();
  const db = getDb();
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  if (userCount === 0) {
    console.log('🌱 Database empty — auto-seeding...');
    const salt = bcrypt.genSaltSync(10);

    UserModel.create({ name: 'Admin User', email: 'admin@erp.com', password_hash: bcrypt.hashSync('admin123', salt), role: 'admin' });
    UserModel.create({ name: 'Operations User', email: 'ops@erp.com', password_hash: bcrypt.hashSync('ops123', salt), role: 'operations' });
    UserModel.create({ name: 'Sales User', email: 'sales@erp.com', password_hash: bcrypt.hashSync('sales123', salt), role: 'sales' });

    const locA = LocationModel.create({ name: 'Warehouse A', address: '12 Industrial Ave, Mumbai' });
    const locB = LocationModel.create({ name: 'Warehouse B', address: '45 Trade Zone, Delhi' });
    const locC = LocationModel.create({ name: 'Store C', address: '8 Commerce St, Pune' });

    const cat1 = CategoryModel.create({ name: 'Electronics' });
    const cat2 = CategoryModel.create({ name: 'Raw Materials' });
    const cat3 = CategoryModel.create({ name: 'Finished Goods' });

    const items = [
      ItemModel.create({ name: 'Circuit Board A', unit: 'pcs', category_id: cat1.id }),
      ItemModel.create({ name: 'Steel Rod 10mm', unit: 'kg', category_id: cat2.id }),
      ItemModel.create({ name: 'Copper Wire 2m', unit: 'roll', category_id: cat2.id }),
      ItemModel.create({ name: 'Assembled Motor', unit: 'pcs', category_id: cat3.id }),
      ItemModel.create({ name: 'Power Adapter 12V', unit: 'pcs', category_id: cat1.id }),
    ];

    const invData = [
      { item_id: items[0].id, location_id: locA.id, batch: 'BATCH-A01', physical_qty: 200, reserved_qty: 0 },
      { item_id: items[1].id, location_id: locA.id, batch: 'BATCH-A02', physical_qty: 500, reserved_qty: 0 },
      { item_id: items[2].id, location_id: locA.id, batch: 'BATCH-A03', physical_qty: 100, reserved_qty: 0 },
      { item_id: items[0].id, location_id: locB.id, batch: 'BATCH-B01', physical_qty: 150, reserved_qty: 0 },
      { item_id: items[3].id, location_id: locB.id, batch: 'BATCH-B02', physical_qty: 80, reserved_qty: 0 },
      { item_id: items[4].id, location_id: locB.id, batch: 'BATCH-B03', physical_qty: 60, reserved_qty: 0 },
      { item_id: items[3].id, location_id: locC.id, batch: 'BATCH-C01', physical_qty: 30, reserved_qty: 0 },
      { item_id: items[4].id, location_id: locC.id, batch: 'BATCH-C02', physical_qty: 40, reserved_qty: 0 },
    ];

    for (const d of invData) {
      db.prepare('INSERT INTO inventory (item_id, location_id, batch, physical_qty, reserved_qty) VALUES (?,?,?,?,?)').run(d.item_id, d.location_id, d.batch, d.physical_qty, d.reserved_qty);
    }

    console.log('✅ Auto-seed complete!');
    console.log('  Admin:      admin@erp.com / admin123');
    console.log('  Operations: ops@erp.com   / ops123');
    console.log('  Sales:      sales@erp.com / sales123');
  } else {
    console.log('✅ Database already seeded, skipping.');
  }
}

try {
  autoSeed();
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📄 API Docs: http://localhost:${PORT}/api-docs`);
  });
} catch (err) {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
}
