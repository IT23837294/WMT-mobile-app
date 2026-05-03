const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadPrescription,
  getMyPrescriptions,
  getAllPrescriptions,
  getPrescription,
  reviewPrescription,
  rejectPrescription,
  updatePrescription
} = require('../controllers/prescriptionController');

// Customer routes
router.post('/upload', protect, authorize('customer'), upload.single('prescription'), uploadPrescription);
router.get('/my-prescriptions', protect, authorize('customer'), getMyPrescriptions);

// Pharmacist and Admin routes
router.get('/', protect, authorize('admin', 'pharmacist'), getAllPrescriptions);
router.get('/:id', protect, getPrescription);
router.put('/:id/review', protect, authorize('admin', 'pharmacist'), reviewPrescription);
router.put('/:id/reject', protect, authorize('admin', 'pharmacist'), rejectPrescription);

// Admin only
router.put('/:id', protect, authorize('admin'), updatePrescription);

module.exports = router;
