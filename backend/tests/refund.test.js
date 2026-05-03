const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Order = require('../models/Order');
const Refund = require('../models/Refund');
const RestockLog = require('../models/RestockLog');

describe('Refund API', () => {
  let supportOfficer, customer, medicine, order;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);
  });

  beforeEach(async () => {
    // Clean up previous data
    await User.deleteMany({});
    await Medicine.deleteMany({});
    await Order.deleteMany({});
    await Refund.deleteMany({});
    await RestockLog.deleteMany({});

    // Create test users
    customer = await User.create({
      name: 'Test Customer',
      email: 'customer@test.com',
      password: 'password123',
      role: 'customer'
    });

    supportOfficer = await User.create({
      name: 'Support Officer',
      email: 'support@test.com',
      password: 'password123',
      role: 'pharmacist' // Using pharmacist as support role
    });

    // Create test medicine
    medicine = await Medicine.create({
      name: 'Test Medicine',
      category: 'Test Category',
      price: 100,
      stockQuantity: 50,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      supplier: new mongoose.Types.ObjectId()
    });

    // Create test order
    order = await Order.create({
      user: customer._id,
      orderNumber: 'TEST123456',
      items: [{
        medicine: medicine._id,
        quantity: 5,
        price: 100,
        total: 500
      }],
      totalAmount: 500,
      finalAmount: 550, // including delivery
      paymentMethod: 'cod',
      orderStatus: 'delivered',
      deliveryAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'India'
      },
      contactNumber: '1234567890'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/refunds', () => {
    it('should successfully process refund and restock medicines', async () => {
      const initialStock = medicine.stockQuantity;

      const response = await request(app)
        .post('/api/refunds')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN || 'test-token'}`)
        .send({
          order_id: order._id,
          reason: 'Customer requested refund',
          processed_by: supportOfficer._id
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.refundedAmount).toBe(550);
      expect(response.body.data.orderNumber).toBe('TEST123456');

      // Check order status
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.orderStatus).toBe('refunded');
      expect(updatedOrder.refundStatus).toBe('processed');
      expect(updatedOrder.refundAmount).toBe(550);

      // Check medicine restock
      const updatedMedicine = await Medicine.findById(medicine._id);
      expect(updatedMedicine.stockQuantity).toBe(initialStock + 5);

      // Check refund record
      const refund = await Refund.findOne({ order: order._id });
      expect(refund).toBeTruthy();
      expect(refund.amount).toBe(550);
      expect(refund.reason).toBe('Customer requested refund');
      expect(refund.processedBy.toString()).toBe(supportOfficer._id.toString());

      // Check restock log
      const restockLog = await RestockLog.findOne({ refund: refund._id });
      expect(restockLog).toBeTruthy();
      expect(restockLog.medicine.toString()).toBe(medicine._id.toString());
      expect(restockLog.quantityAdded).toBe(5);
      expect(restockLog.previousStock).toBe(initialStock);
      expect(restockLog.newStock).toBe(initialStock + 5);
    });

    it('should reject refund for already refunded order', async () => {
      // First, process a refund
      await request(app)
        .post('/api/refunds')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN || 'test-token'}`)
        .send({
          order_id: order._id,
          reason: 'First refund',
          processed_by: supportOfficer._id
        });

      // Try to refund again
      const response = await request(app)
        .post('/api/refunds')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN || 'test-token'}`)
        .send({
          order_id: order._id,
          reason: 'Second refund attempt',
          processed_by: supportOfficer._id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order has already been refunded');
    });

    it('should reject refund for non-existent order', async () => {
      const fakeOrderId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/refunds')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN || 'test-token'}`)
        .send({
          order_id: fakeOrderId,
          reason: 'Test refund',
          processed_by: supportOfficer._id
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order not found');
    });

    it('should reject refund for cancelled order', async () => {
      // Create a cancelled order
      const cancelledOrder = await Order.create({
        user: customer._id,
        orderNumber: 'CANCEL123',
        items: [{
          medicine: medicine._id,
          quantity: 2,
          price: 100,
          total: 200
        }],
        totalAmount: 200,
        finalAmount: 250,
        paymentMethod: 'cod',
        orderStatus: 'cancelled',
        deliveryAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'India'
        },
        contactNumber: '1234567890'
      });

      const response = await request(app)
        .post('/api/refunds')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN || 'test-token'}`)
        .send({
          order_id: cancelledOrder._id,
          reason: 'Test refund',
          processed_by: supportOfficer._id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order has been cancelled and cannot be refunded');
    });

    it('should reject refund with missing required fields', async () => {
      const response = await request(app)
        .post('/api/refunds')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN || 'test-token'}`)
        .send({
          reason: 'Test refund'
          // Missing order_id and processed_by
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order ID and processed by user ID are required');
    });
  });

  describe('GET /api/refunds/:orderId', () => {
    it('should return refund details for an order', async () => {
      // First create a refund
      await request(app)
        .post('/api/refunds')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN || 'test-token'}`)
        .send({
          order_id: order._id,
          reason: 'Test refund',
          processed_by: supportOfficer._id
        });

      const response = await request(app)
        .get(`/api/refunds/${order._id}`)
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN || 'test-token'}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order.id).toBe(order._id.toString());
      expect(response.body.data.order.orderNumber).toBe('TEST123456');
      expect(response.body.data.refunds).toHaveLength(1);
      expect(response.body.data.refunds[0].amount).toBe(550);
      expect(response.body.data.restockLogs).toHaveLength(1);
      expect(response.body.data.restockLogs[0].quantityAdded).toBe(5);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeOrderId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/refunds/${fakeOrderId}`)
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN || 'test-token'}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order not found');
    });
  });
});
