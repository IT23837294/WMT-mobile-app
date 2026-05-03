const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const {
  getAvailableStockForMedicine,
  allocateBatchesForMedicine,
  reduceBatchAllocations,
  restoreBatchAllocations
} = require('../services/inventoryBatchService');
const { 
  isEmailConfigured, 
  sendOrderReceiptEmail,
  sendPaymentConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendRefundApprovedEmail
} = require('../services/emailService');

const DEFAULT_TRACKING_CARRIER = 'PharmaCare Courier';

const generateTrackingNumber = (order) => {
  const orderSegment = String(order?.orderNumber || order?._id || 'ORD')
    .replace(/[^A-Z0-9]/gi, '')
    .slice(-8)
    .toUpperCase();

  const timeSegment = Date.now().toString().slice(-6);
  return `PC-${orderSegment}-${timeSegment}`;
};

const buildTrackingUrl = (order) => `/customer/orders/${order._id}`;

const buildAutomaticTrackingDetails = (order) => ({
  trackingNumber: order.trackingNumber || generateTrackingNumber(order),
  trackingCarrier: order.trackingCarrier || DEFAULT_TRACKING_CARRIER,
  trackingUrl: order.trackingUrl || buildTrackingUrl(order),
  trackingUpdatedAt: new Date()
});

const ensureOrderOperationalFields = async (order) => {
  if (!order) {
    return order;
  }

  let changed = false;

  if (!order.orderNumber) {
    const count = await Order.countDocuments({
      _id: { $ne: order._id }
    });
    order.orderNumber = `ORD${Date.now()}${String(count + 1).padStart(4, '0')}`;
    changed = true;
  }

  if (!order.trackingNumber) {
    Object.assign(order, buildAutomaticTrackingDetails(order));
    changed = true;
  }

  if (changed) {
    await order.save();
  }

  return order;
};

const restoreOrderStock = async (order) => {
  if (!order || order.stockRestoredAt) {
    return false;
  }

  for (const item of order.items) {
    if (Array.isArray(item.batchAllocations) && item.batchAllocations.length > 0) {
      await restoreBatchAllocations(item.batchAllocations, {
        medicineId: item.medicine,
        transactionType: 'CUSTOMER_RETURN_IN',
        reason: 'Customer return / order cancellation restored stock',
        referenceType: 'Order',
        referenceId: order._id,
        notes: `Order ${order.orderNumber || order._id} stock restored`
      });
    } else {
      await Medicine.findByIdAndUpdate(
        item.medicine,
        { $inc: { stockQuantity: item.quantity } }
      );
    }
  }

  order.stockRestoredAt = new Date();
  await order.save();
  return true;
};

const sendReceiptForOrder = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate('user', 'name email phone')
    .populate('items.medicine', 'name category price image');

  if (!order || order.paymentStatus !== 'paid' || !order.receiptEmail) {
    return { sent: false };
  }

  if (!isEmailConfigured()) {
    return {
      sent: false,
      message: 'Email service is not configured on the server'
    };
  }

  await sendOrderReceiptEmail(order);

  order.receiptStatus = 'sent';
  order.receiptSentAt = new Date();
  await order.save();

  return { sent: true, order };
};

exports.createOrder = async (req, res) => {
  try {
    const {
      paymentMethod,
      contactNumber,
      notes,
      receiptEmail,
      paymentReference,
      cardHolderName,
      cardNumber,
      cardExpiryMonth,
      cardExpiryYear,
      cardCvv
    } = req.body;
    const deliveryAddress = req.body.deliveryAddress || {
      street: req.body['deliveryAddress[street]'],
      city: req.body['deliveryAddress[city]'],
      state: req.body['deliveryAddress[state]'],
      zipCode: req.body['deliveryAddress[zipCode]'],
      country: req.body['deliveryAddress[country]']
    };

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    if (!deliveryAddress?.street || !deliveryAddress?.city || !deliveryAddress?.state || !deliveryAddress?.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Complete delivery address is required'
      });
    }

    if (!contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Contact number is required'
      });
    }

    if (paymentMethod === 'bank_deposit' && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Bank deposit receipt is required'
      });
    }

    if (paymentMethod === 'bank_deposit' && !paymentReference) {
      return res.status(400).json({
        success: false,
        message: 'Bank deposit reference is required'
      });
    }

    if (paymentMethod === 'card') {
      const sanitizedCardNumber = String(cardNumber || '').replace(/\D/g, '');
      const sanitizedCvv = String(cardCvv || '').replace(/\D/g, '');

      if (!cardHolderName || sanitizedCardNumber.length < 12 || !cardExpiryMonth || !cardExpiryYear || sanitizedCvv.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Complete card details are required'
        });
      }
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.medicine', 'name stockQuantity price isActive');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate stock availability
    for (const item of cart.items) {
      if (!item.medicine.isActive) {
        return res.status(400).json({
          success: false,
          message: `${item.medicine.name} is no longer available`
        });
      }
      const { availableStock } = await getAvailableStockForMedicine(item.medicine._id);
      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} valid units of ${item.medicine.name} available`
        });
      }
    }

    // Calculate totals
    const totalAmount = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    const deliveryCharge = 50;
    const discount = 0;
    const finalAmount = totalAmount + deliveryCharge - discount;

    // Create order items
    const orderItems = [];
    for (const item of cart.items) {
      const allocationResult = await allocateBatchesForMedicine(item.medicine._id, item.quantity);

      if (!allocationResult.sourceMedicine || allocationResult.allocations.length === 0) {
        return res.status(400).json({
          success: false,
          message: `No valid batch stock available for ${item.medicine.name}`
        });
      }

      orderItems.push({
        medicine: item.medicine._id,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        batchAllocations: allocationResult.allocations
      });
    }

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      prescription: cart.prescription,
      totalAmount,
      deliveryCharge,
      discount,
      finalAmount,
      paymentMethod,
      paymentReference,
      depositReceipt: req.file ? `/uploads/${req.file.filename}` : undefined,
      cardSummary: paymentMethod === 'card' ? {
        cardHolderName,
        last4: String(cardNumber).replace(/\D/g, '').slice(-4),
        expiryMonth: cardExpiryMonth,
        expiryYear: cardExpiryYear
      } : undefined,
      deliveryAddress,
      contactNumber,
      notes,
      paymentStatus: paymentMethod === 'online' || paymentMethod === 'card' ? 'paid' : 'pending',
      refundStatus: 'not_applicable',
      receiptEmail: receiptEmail || undefined,
      receiptStatus: receiptEmail ? 'registered' : 'not_registered',
      receiptRegisteredAt: receiptEmail ? new Date() : undefined
    });

    if (!order.trackingNumber) {
      Object.assign(order, buildAutomaticTrackingDetails(order));
      await order.save();
    }

    // Reduce stock for each medicine
    for (const item of orderItems) {
      await reduceBatchAllocations(item.batchAllocations || [], {
        medicineId: item.medicine,
        transactionType: 'SALE_OUT',
        reason: 'Medicine sold from inventory using FEFO issuing',
        changedBy: req.user?.id || req.user?._id || null,
        referenceType: 'Order',
        referenceId: order._id,
        notes: `Order ${order.orderNumber || order._id} issued`
      });
    }

    // Update prescription status if exists
    if (cart.prescription) {
      await Prescription.findByIdAndUpdate(
        cart.prescription,
        { status: 'completed' }
      );
    }

    // Clear cart
    cart.items = [];
    cart.prescription = null;
    cart.totalAmount = 0;
    await cart.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('items.medicine', 'name category price')
      .populate('user', 'name email phone');

    let receiptMessage;
    if (populatedOrder.paymentStatus === 'paid') {
      try {
        if (populatedOrder.receiptEmail) {
          const receiptResult = await sendReceiptForOrder(populatedOrder._id);
          if (!receiptResult.sent && receiptResult.message) {
            receiptMessage = receiptResult.message;
          }
        }
        await sendPaymentConfirmationEmail(populatedOrder);
      } catch (emailError) {
        console.error('Payment confirmation email error:', emailError.message);
      }
    }

    const refreshedOrder = await Order.findById(order._id)
      .populate('items.medicine', 'name category price')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: receiptMessage ? `Order placed successfully. ${receiptMessage}` : 'Order placed successfully',
      order: refreshedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    let orders = await Order.find({ user: req.user.id })
      .populate('items.medicine', 'name category price image')
      .sort({ createdAt: -1 });

    orders = await Promise.all(orders.map((order) => ensureOrderOperationalFields(order)));

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, orderStatus } = req.query;
    let query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (orderStatus) query.orderStatus = orderStatus;

    let orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.medicine', 'name category price image')
      .sort({ createdAt: -1 });

    orders = await Promise.all(orders.map((order) => ensureOrderOperationalFields(order)));

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('items.medicine', 'name category price image')
      .populate('prescription', 'status image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (req.user.role === 'customer' && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    order = await ensureOrderOperationalFields(order);

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, notes, trackingNumber, trackingCarrier, trackingUrl } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const updateData = {};
    if (orderStatus) {
      updateData.orderStatus = orderStatus;
      if (orderStatus === 'shipped') updateData.shippedAt = new Date();
      if (orderStatus === 'delivered') updateData.deliveredAt = new Date();
      if (orderStatus === 'rejected' && order.paymentStatus === 'paid') {
        updateData.refundStatus = 'pending';
        updateData.refundAmount = order.finalAmount;
        updateData.refundReason = 'Customer rejected the delivery';
      }
    }
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid' && !order.trackingNumber) {
        Object.assign(updateData, buildAutomaticTrackingDetails(order));
      }
    }
    if (notes) updateData.notes = notes;
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber || undefined;
      updateData.trackingUpdatedAt = trackingNumber ? new Date() : undefined;
    }
    if (trackingCarrier !== undefined) {
      updateData.trackingCarrier = trackingCarrier || undefined;
      updateData.trackingUpdatedAt = new Date();
    }
    if (trackingUrl !== undefined) {
      updateData.trackingUrl = trackingUrl || undefined;
      updateData.trackingUpdatedAt = new Date();
    }

    if (orderStatus === 'shipped' && !updateData.trackingNumber && !order.trackingNumber) {
      Object.assign(updateData, buildAutomaticTrackingDetails(order));
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email phone')
      .populate('items.medicine', 'name category price');

    if (orderStatus === 'rejected' || orderStatus === 'cancelled') {
      await restoreOrderStock(updatedOrder);
    }

    let message = 'Order updated successfully';
    
    if (paymentStatus === 'paid' && updatedOrder.receiptEmail) {
      try {
        const receiptResult = await sendReceiptForOrder(updatedOrder._id);
        if (!receiptResult.sent && receiptResult.message) {
          message = `${message}. ${receiptResult.message}`;
        } else if (receiptResult.sent) {
          message = 'Order updated successfully and e-receipt sent';
        }
      } catch (emailError) {
        message = `${message}. Receipt email failed: ${emailError.message}`;
      }
    }

    if (orderStatus === 'shipped') {
      try {
        await sendOrderShippedEmail(updatedOrder);
      } catch (emailError) {
        console.error('Shipped email error:', emailError.message);
      }
    }

    if (orderStatus === 'delivered') {
      try {
        await sendOrderDeliveredEmail(updatedOrder);
      } catch (emailError) {
        console.error('Delivered email error:', emailError.message);
      }
    }

    res.json({
      success: true,
      message,
      order: await Order.findById(updatedOrder._id)
        .populate('user', 'name email phone')
        .populate('items.medicine', 'name category price')
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateReceiptDetails = async (req, res) => {
  try {
    const { receiptEmail, receiptStatus } = req.body;

    const updateData = {};

    if (receiptEmail !== undefined) {
      updateData.receiptEmail = receiptEmail || undefined;
      updateData.receiptRegisteredAt = receiptEmail ? new Date() : undefined;
      updateData.receiptStatus = receiptEmail ? (receiptStatus || 'registered') : 'not_registered';
      updateData.receiptSentAt = receiptStatus === 'sent' && receiptEmail ? new Date() : undefined;
    } else if (receiptStatus) {
      updateData.receiptStatus = receiptStatus;
      if (receiptStatus === 'sent') {
        updateData.receiptSentAt = new Date();
      }
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email phone')
      .populate('items.medicine', 'name category price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    let message = 'Receipt details updated successfully';
    if ((receiptEmail !== undefined && order.paymentStatus === 'paid' && order.receiptEmail) || receiptStatus === 'sent') {
      try {
        const receiptResult = await sendReceiptForOrder(order._id);
        if (!receiptResult.sent && receiptResult.message) {
          message = `${message}. ${receiptResult.message}`;
        } else if (receiptResult.sent) {
          message = 'Receipt details updated successfully and e-receipt sent';
        }
      } catch (emailError) {
        message = `${message}. Receipt email failed: ${emailError.message}`;
      }
    }

    res.json({
      success: true,
      message,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow cancellation if order is still processing
    if (order.orderStatus !== 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Check authorization
    if (req.user.role === 'customer' && order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    order.orderStatus = 'cancelled';
    await restoreOrderStock(order);
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const { refundAmount, refundReason } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.medicine', 'name category price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Refund can only be processed for paid orders'
      });
    }

    const safeRefundAmount = Number(refundAmount || order.finalAmount);
    if (Number.isNaN(safeRefundAmount) || safeRefundAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount must be a valid positive number'
      });
    }

    if (safeRefundAmount > Number(order.finalAmount || 0)) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed the original paid amount'
      });
    }

    const actorLabel = req.user?.role === 'support_officer' ? 'support officer' : 'admin';

    order.refundStatus = 'processed';
    order.refundAmount = safeRefundAmount;
    order.refundReason = refundReason || order.refundReason || `Refund processed by ${actorLabel}`;
    order.refundProcessedAt = new Date();
    order.paymentStatus = 'failed';

    await order.save();

    try {
      await sendRefundApprovedEmail(order);
    } catch (emailError) {
      console.error('Refund email error:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          avgOrderValue: { $avg: '$finalAmount' }
        }
      }
    ]);

    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const paymentStats = await Order.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly sales data
    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sales: { $sum: '$finalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        overall: stats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
        byStatus: statusStats,
        byPayment: paymentStats,
        monthlySales
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
