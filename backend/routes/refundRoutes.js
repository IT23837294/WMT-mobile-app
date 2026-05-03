const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const Refund = require('../models/Refund');
const RestockLog = require('../models/RestockLog');

// POST /api/refunds - Process refund and restock
router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();
    
    const { order_id, reason, processed_by } = req.body;
    
    // Input validation
    if (!order_id || !processed_by) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Order ID and processed by user ID are required'
      });
    }
    
    // Find order with populated items and medicines
    const order = await Order.findById(order_id)
      .populate('user', 'name email')
      .populate('items.medicine', 'name stockQuantity');
    
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Eligibility checks
    if (order.orderStatus === 'refunded') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Order has already been refunded'
      });
    }
    
    if (order.orderStatus === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Order has been cancelled and cannot be refunded'
      });
    }
    
    const eligibleStatuses = ['processing', 'shipped', 'delivered'];
    if (!eligibleStatuses.includes(order.orderStatus)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Order cannot be refunded in current status: ${order.orderStatus}`
      });
    }
    
    // Create refund record
    const refund = new Refund({
      order: order._id,
      amount: order.finalAmount,
      reason: reason || 'Customer requested refund',
      processedBy: processed_by,
      status: 'processed',
      restockCompleted: true
    });
    
    await refund.save({ session });
    
    // Update order status
    order.orderStatus = 'refunded';
    order.refundStatus = 'processed';
    order.refundAmount = order.finalAmount;
    order.refundReason = reason || 'Customer requested refund';
    order.refundProcessedAt = new Date();
    order.stockRestoredAt = new Date();
    
    await order.save({ session });
    
    // Restock medicines
    const restockLogs = [];
    
    for (const item of order.items) {
      const medicine = item.medicine;
      const previousStock = medicine.stockQuantity;
      const quantityToAdd = item.quantity;
      const newStock = previousStock + quantityToAdd;
      
      // Update medicine stock
      medicine.stockQuantity = newStock;
      await medicine.save({ session });
      
      // Create restock log
      const restockLog = new RestockLog({
        medicine: medicine._id,
        quantityAdded: quantityToAdd,
        refund: refund._id,
        previousStock: previousStock,
        newStock: newStock,
        reason: `Refund restock for order ${order.orderNumber}`
      });
      
      await restockLog.save({ session });
      restockLogs.push({
        medicineName: medicine.name,
        quantityAdded: quantityToAdd,
        previousStock: previousStock,
        newStock: newStock
      });
    }
    
    await session.commitTransaction();
    
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        refundedAmount: order.finalAmount,
        refundId: refund._id,
        customerName: order.user.name,
        restockedMedicines: restockLogs,
        processedAt: order.refundProcessedAt
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during refund processing'
    });
  } finally {
    session.endSession();
  }
});

// GET /api/refunds/:orderId - Get refund details for an order
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate({
        path: 'items.medicine',
        select: 'name stockQuantity'
      });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const refunds = await Refund.find({ order: orderId })
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });
    
    const restockLogs = await RestockLog.find({ refund: { $in: refunds.map(r => r._id) } })
      .populate('medicine', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.user.name,
          customerEmail: order.user.email,
          orderDate: order.createdAt,
          orderStatus: order.orderStatus,
          finalAmount: order.finalAmount,
          items: order.items.map(item => ({
            medicineName: item.medicine.name,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.total
          }))
        },
        refunds: refunds.map(refund => ({
          id: refund._id,
          amount: refund.amount,
          reason: refund.reason,
          status: refund.status,
          processedBy: refund.processedBy.name,
          processedAt: refund.createdAt
        })),
        restockLogs: restockLogs.map(log => ({
          medicineName: log.medicine.name,
          quantityAdded: log.quantityAdded,
          previousStock: log.previousStock,
          newStock: log.newStock,
          reason: log.reason,
          createdAt: log.createdAt
        }))
      }
    });
    
  } catch (error) {
    console.error('Get refund details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
