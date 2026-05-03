const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllSuppliers,
  getSupplier,
  getCurrentSupplier,
  updateCurrentSupplier,
  createSupplier,
  submitSupplierApplication,
  updateSupplier,
  toggleSupplierStatus,
  deleteSupplier,
  getSupplierStats
} = require('../controllers/supplierController');

router.post('/apply', submitSupplierApplication);
router.get('/me', protect, authorize('supplier', 'admin'), getCurrentSupplier);
router.put('/me', protect, authorize('supplier', 'admin'), updateCurrentSupplier);

// Admin & pharmacist routes
router.get('/', protect, authorize('admin', 'pharmacist'), getAllSuppliers);
router.get('/stats', protect, authorize('admin'), getSupplierStats);
router.post('/', protect, authorize('admin'), createSupplier);
router.get('/:id', protect, authorize('admin'), getSupplier);
router.put('/:id', protect, authorize('admin'), updateSupplier);
router.put('/:id/toggle-status', protect, authorize('admin'), toggleSupplierStatus);
router.delete('/:id', protect, authorize('admin'), deleteSupplier);

module.exports = router;
