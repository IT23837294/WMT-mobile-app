const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    default: null
  },
  batchNo: {
    type: String,
    trim: true,
    default: ''
  },
  transactionType: {
    type: String,
    enum: [
      'PURCHASE_IN',
      'SALE_OUT',
      'CUSTOMER_RETURN_IN',
      'CUSTOMER_RETURN_OUT',
      'DAMAGED_WRITEOFF',
      'EXPIRED_WRITEOFF',
      'MANUAL_ADJUSTMENT_IN',
      'MANUAL_ADJUSTMENT_OUT'
    ],
    required: true
  },
  direction: {
    type: String,
    enum: ['IN', 'OUT'],
    required: true
  },
  quantity: {
    type: Number,
    min: 1,
    required: true
  },
  beforeQuantity: {
    type: Number,
    min: 0,
    default: 0
  },
  afterQuantity: {
    type: Number,
    min: 0,
    default: 0
  },
  reason: {
    type: String,
    trim: true,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referenceType: {
    type: String,
    trim: true,
    default: ''
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StockMovement', stockMovementSchema);
