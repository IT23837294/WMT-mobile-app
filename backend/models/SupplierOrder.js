const mongoose = require('mongoose');

const supplierOrderItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  currentStock: {
    type: Number,
    default: 0
  },
  reorderLevel: {
    type: Number,
    default: 10
  },
  recommendedQuantity: {
    type: Number,
    required: true,
    min: [1, 'Recommended quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    default: 0
  },
  moq: {
    type: Number,
    default: 1
  },
  leadTime: {
    type: String,
    default: ''
  },
  lineTotal: {
    type: Number,
    default: 0
  },
  recommendationReason: {
    type: String,
    default: ''
  }
}, { _id: false });

const supplierOrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  items: [supplierOrderItemSchema],
  status: {
    type: String,
    enum: ['suggested', 'approved', 'sent', 'completed', 'cancelled'],
    default: 'suggested'
  },
  isAutoSuggested: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  expectedDeliveryDate: {
    type: Date,
    default: null
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  approvedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  communicationStatus: {
    type: String,
    enum: ['draft', 'sent'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SupplierOrder', supplierOrderSchema);
