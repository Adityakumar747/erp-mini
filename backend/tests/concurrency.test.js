/**
 * Concurrency Test:
 * Two users must not be able to reserve more stock than actually exists.
 * Example: Available = 100
 * User A -> Reserve 80
 * User B -> Reserve 50
 * Both requests must NOT succeed. Exactly one succeeds, one fails.
 */
const request = require('supertest');
const app = require('../src/app');
const { setupTestDB, teardownTestDB, getSeededData } = require('./testSetup');
const jwt = require('jsonwebtoken');

let salesToken;
let seededData;

beforeAll(async () => {
  seededData = await setupTestDB();
  salesToken = jwt.sign({ id: seededData.sales.id, role: 'sales' }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await teardownTestDB();
});

describe('High-Concurrency Stock Reservation Safety', () => {
  it('prevents overselling when two users concurrently reserve more than available stock', async () => {
    // seededData has Item at Location A with Physical=100, Reserved=0 -> Available=100

    const userARequest = request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        item_id: seededData.item.id,
        location_id: seededData.locA.id,
        quantity: 80,
        customer_name: 'User A Order',
      });

    const userBRequest = request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        item_id: seededData.item.id,
        location_id: seededData.locA.id,
        quantity: 50,
        customer_name: 'User B Order',
      });

    // Execute concurrently
    const [resA, resB] = await Promise.all([userARequest, userBRequest]);

    const statuses = [resA.statusCode, resB.statusCode];
    // Exactly one should be 201 Created and one should be 400 Bad Request
    expect(statuses).toContain(201);
    expect(statuses).toContain(400);

    const successfulRes = resA.statusCode === 201 ? resA : resB;
    const failedRes = resA.statusCode === 400 ? resA : resB;

    expect(successfulRes.body.success).toBe(true);
    expect(failedRes.body.success).toBe(false);
    expect(failedRes.body.message).toMatch(/insufficient/i);
  });
});
