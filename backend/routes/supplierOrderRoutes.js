const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSupplierOrders,
  createSupplierOrder,
  approveSupplierOrder,
  getSupplierOrderSuggestions
} = require('../controllers/supplierOrderController');

router.get('/', protect, authorize('admin', 'pharmacist'), getSupplierOrders);
router.get('/suggestions', protect, authorize('admin', 'pharmacist'), getSupplierOrderSuggestions);
router.post('/', protect, authorize('admin', 'pharmacist'), createSupplierOrder);
router.put('/:id/approve', protect, authorize('admin', 'pharmacist'), approveSupplierOrder);

module.exports = router;
