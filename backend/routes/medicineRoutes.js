const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getAllMedicines,
  getMedicine,
  getMedicineBatches,
  createMedicine,
  createMedicineBatch,
  updateMedicine,
  updateMedicineBatch,
  deleteMedicine,
  deactivateMedicineBatch,
  getStockMovements,
  createStockAdjustment,
  getCategories,
  getAlerts,
  removeExpiredMedicines
} = require('../controllers/medicineController');

// Public routes
router.get('/', getAllMedicines);
router.get('/categories', getCategories);
router.get('/alerts', protect, authorizeRoles('admin', 'pharmacist'), getAlerts);
router.get('/stock-movements', protect, authorizeRoles('admin', 'pharmacist'), getStockMovements);
router.get('/:id/batches', protect, authorizeRoles('admin', 'pharmacist'), getMedicineBatches);
router.get('/:id', getMedicine);

// Protected routes - Admin and Pharmacist only
router.post('/', protect, authorizeRoles('admin', 'pharmacist'), upload.single('image'), createMedicine);
router.post('/:id/batches', protect, authorizeRoles('admin', 'pharmacist'), createMedicineBatch);
router.post('/:id/stock-adjustments', protect, authorizeRoles('admin', 'pharmacist'), createStockAdjustment);
router.put('/:id', protect, authorizeRoles('admin', 'pharmacist'), upload.single('image'), updateMedicine);
router.put('/:id/batches/:batchId', protect, authorizeRoles('admin', 'pharmacist'), updateMedicineBatch);
router.delete('/:id/batches/:batchId', protect, authorizeRoles('admin', 'pharmacist'), deactivateMedicineBatch);
router.delete('/:id', protect, authorizeRoles('admin', 'pharmacist'), deleteMedicine);

// Admin only - remove expired
router.post('/remove-expired', protect, authorizeRoles('admin'), removeExpiredMedicines);

module.exports = router;
