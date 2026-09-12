/**
 * Test 2: Cannot transfer more than available inventory
 * Test 3: Destination stock increases only after transfer receipt
 * Test 4: Same transfer cannot be received twice
 */
const request = require('supertest');
const app = require('../src/app');
const { setupTestDB, teardownTestDB, getSeededData } = require('./testSetup');
const { InventoryModel } = require('../src/models');
const jwt = require('jsonwebtoken');

let opsToken, adminToken;
let seededData;
let createdTransferId;

beforeAll(async () => {
  seededData = await setupTestDB();
  opsToken = jwt.sign({ id: seededData.ops.id, role: 'operations' }, process.env.JWT_SECRET);
  adminToken = jwt.sign({ id: seededData.admin.id, role: 'admin' }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await teardownTestDB();
});

describe('Test 2 — Cannot transfer more than available inventory', () => {
  it('should fail dispatch when quantity > available at source', async () => {
    // Create a transfer requesting 999 (far exceeds 100 in stock)
    const createRes = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({
        source_location_id: seededData.locA.id,
        dest_location_id: seededData.locB.id,
        item_id: seededData.item.id,
        quantity: 999,
      });
    expect(createRes.statusCode).toBe(201);

    const dispatchRes = await request(app)
      .patch(`/api/transfers/${createRes.body.data.id}/dispatch`)
      .set('Authorization', `Bearer ${opsToken}`);
    expect(dispatchRes.statusCode).toBe(400);
    expect(dispatchRes.body.message).toMatch(/insufficient/i);
  });

  it('should succeed dispatch when quantity <= available at source', async () => {
    const createRes = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({
        source_location_id: seededData.locA.id,
        dest_location_id: seededData.locB.id,
        item_id: seededData.item.id,
        quantity: 40,
      });
    expect(createRes.statusCode).toBe(201);
    createdTransferId = createRes.body.data.id;

    const dispatchRes = await request(app)
      .patch(`/api/transfers/${createdTransferId}/dispatch`)
      .set('Authorization', `Bearer ${opsToken}`);
    expect(dispatchRes.statusCode).toBe(200);
    expect(dispatchRes.body.data.status).toBe('Dispatched');
  });
});

describe('Test 3 — Destination stock increases only after receipt', () => {
  it('destination stock should NOT increase after dispatch', async () => {
    // After dispatch of 40 units from locA to locB, locB should still have 0
    const destInv = InventoryModel.findByItemAndLocation(seededData.item.id, seededData.locB.id);
    const destTotal = destInv.reduce((sum, r) => sum + parseFloat(r.physical_qty), 0);
    expect(destTotal).toBe(0);
  });

  it('source stock should decrease after dispatch', async () => {
    const srcInv = InventoryModel.findByItemAndLocation(seededData.item.id, seededData.locA.id);
    const srcTotal = srcInv.reduce((sum, r) => sum + parseFloat(r.physical_qty), 0);
    expect(srcTotal).toBe(60); // 100 - 40 = 60
  });

  it('destination stock should increase after receipt', async () => {
    const receiveRes = await request(app)
      .patch(`/api/transfers/${createdTransferId}/receive`)
      .set('Authorization', `Bearer ${opsToken}`);
    expect(receiveRes.statusCode).toBe(200);

    const destInv = InventoryModel.findByItemAndLocation(seededData.item.id, seededData.locB.id);
    const destTotal = destInv.reduce((sum, r) => sum + parseFloat(r.physical_qty), 0);
    expect(destTotal).toBe(40); // should now have the 40 units
  });
});

describe('Test 4 — Same transfer cannot be received twice', () => {
  it('should reject second receive with 409 Conflict', async () => {
    const receiveRes = await request(app)
      .patch(`/api/transfers/${createdTransferId}/receive`)
      .set('Authorization', `Bearer ${opsToken}`);
    expect(receiveRes.statusCode).toBe(409);
    expect(receiveRes.body.message).toMatch(/already been received/i);
  });
});
