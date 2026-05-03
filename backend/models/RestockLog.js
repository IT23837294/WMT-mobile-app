const mongoose = require('mongoose');

const restockLogSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine is required']
  },
  quantityAdded: {
    type: Number,
    required: [true, 'Quantity added is required'],
    min: [1, 'Quantity added must be at least 1']
  },
  refund: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Refund',
    required: [true, 'Refund reference is required']
  },
  previousStock: {
    type: Number,
    required: [true, 'Previous stock level is required'],
    min: [0, 'Previous stock cannot be negative']
  },
  newStock: {
    type: Number,
    required: [true, 'New stock level is required'],
    min: [0, 'New stock cannot be negative']
  },
  reason: {
    type: String,
    trim: true,
    default: 'Refund restock'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RestockLog', restockLogSchema);
