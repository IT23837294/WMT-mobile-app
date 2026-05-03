const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  requestedQuantity: {
    type: Number,
    min: 1
  },
  fulfillmentStatus: {
    type: String,
    enum: ['approved', 'partial', 'unavailable'],
    default: 'approved'
  },
  allocatedBatchNo: {
    type: String,
    trim: true
  },
  allocatedExpiryDate: {
    type: Date
  }
});

const prescriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  image: {
    type: String,
    required: [true, 'Prescription image is required']
  },
  publicId: {
    type: String,
    required: [true, 'Cloudinary public ID is required']
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'completed', 'rejected'],
    default: 'pending'
  },
  items: [prescriptionItemSchema],
  notes: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  reviewOutcome: {
    type: String,
    enum: ['approved', 'partial', 'rejected', null],
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  deliveryCharge: {
    type: Number,
    default: 50
  },
  discount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate final amount before saving
prescriptionSchema.pre('save', function(next) {
  this.finalAmount = this.totalAmount + this.deliveryCharge - this.discount;
  next();
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
