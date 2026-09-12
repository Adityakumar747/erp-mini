/**
 * Test 1: Cannot reserve more than available inventory
 * Test 5: Unauthorized user cannot perform restricted operation
 */
const request = require('supertest');
const app = require('../src/app');
const { setupTestDB, teardownTestDB, getSeededData } = require('./testSetup');
const jwt = require('jsonwebtoken');

let salesToken, adminToken, opsToken;
let seededData;

beforeAll(async () => {
  seededData = await setupTestDB();
  salesToken = jwt.sign({ id: seededData.sales.id, role: 'sales' }, process.env.JWT_SECRET);
  adminToken = jwt.sign({ id: seededData.admin.id, role: 'admin' }, process.env.JWT_SECRET);
  opsToken = jwt.sign({ id: seededData.ops.id, role: 'operations' }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await teardownTestDB();
});

describe('Test 1 — Cannot reserve more than available inventory', () => {
  it('should succeed when reserving within available qty', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        item_id: seededData.item.id,
        location_id: seededData.locA.id,
        quantity: 50,
        customer_name: 'Customer A',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should fail when reserving more than available qty', async () => {
    // After above, reserved=50, physical=100, available=50
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        item_id: seededData.item.id,
        location_id: seededData.locA.id,
        quantity: 60, // exceeds remaining 50
        customer_name: 'Customer B',
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/insufficient/i);
  });

  it('should fail when reserving exactly available + 1', async () => {
    // available=50 at this point, request 51
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        item_id: seededData.item.id,
        location_id: seededData.locA.id,
        quantity: 51,
        customer_name: 'Customer C',
      });
    expect(res.statusCode).toBe(400);
  });
});

describe('Test 5 — Unauthorized user cannot perform restricted operations', () => {
  it('Sales user cannot create a Work Order (403)', async () => {
    const res = await request(app)
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        location_id: seededData.locA.id,
        item_id: seededData.item.id,
        required_qty: 10,
        assigned_user_id: seededData.ops.id,
      });
    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Operations user cannot create a Customer Order (403)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({
        item_id: seededData.item.id,
        location_id: seededData.locA.id,
        quantity: 5,
      });
    expect(res.statusCode).toBe(403);
  });

  it('Unauthenticated request cannot access inventory (401)', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.statusCode).toBe(401);
  });

  it('Admin can create Work Order successfully', async () => {
    const res = await request(app)
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        location_id: seededData.locA.id,
        item_id: seededData.item.id,
        required_qty: 10,
        assigned_user_id: seededData.ops.id,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
