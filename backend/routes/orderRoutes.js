const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  updateReceiptDetails,
  processRefund,
  cancelOrder,
  getOrderStats
} = require('../controllers/orderController');

// Customer routes
router.post('/', protect, authorize('customer'), upload.single('depositReceipt'), createOrder);
router.get('/my-orders', protect, authorize('customer'), getMyOrders);

// Admin, Pharmacist, and Support Officer routes
router.get('/', protect, authorize('admin', 'pharmacist', 'support_officer'), getAllOrders);
router.get('/stats/overview', protect, authorize('admin'), getOrderStats);

// Shared routes (with authorization check in controller)
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, authorize('admin', 'pharmacist'), updateOrderStatus);
router.put('/:id/receipt', protect, authorize('admin'), updateReceiptDetails);
router.put('/:id/refund', protect, authorize('admin', 'support_officer'), processRefund);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
