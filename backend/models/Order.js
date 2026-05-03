const mongoose = require('mongoose');
const validator = require('validator');

const orderItemSchema = new mongoose.Schema({
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
  total: {
    type: Number,
    required: true,
    min: 0
  },
  batchAllocations: [{
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    batchNo: {
      type: String,
      trim: true,
      default: ''
    },
    expiryDate: {
      type: Date
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }]
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [orderItemSchema],
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
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
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'card', 'online', 'bank_deposit'],
    required: true
  },
  paymentReference: {
    type: String,
    trim: true
  },
  depositReceipt: {
    type: String,
    trim: true
  },
  cardSummary: {
    cardHolderName: {
      type: String,
      trim: true
    },
    last4: {
      type: String,
      trim: true
    },
    expiryMonth: {
      type: String,
      trim: true
    },
    expiryYear: {
      type: String,
      trim: true
    }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  refundStatus: {
    type: String,
    enum: ['not_applicable', 'pending', 'processed'],
    default: 'not_applicable'
  },
  refundAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  refundReason: {
    type: String,
    trim: true
  },
  refundProcessedAt: {
    type: Date
  },
  receiptEmail: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: (value) => !value || validator.isEmail(value),
      message: 'Please provide a valid receipt email'
    }
  },
  receiptStatus: {
    type: String,
    enum: ['not_registered', 'registered', 'sent'],
    default: 'not_registered'
  },
  receiptRegisteredAt: {
    type: Date
  },
  receiptSentAt: {
    type: Date
  },
  orderStatus: {
    type: String,
    enum: ['processing', 'shipped', 'delivered', 'cancelled', 'rejected', 'refunded'],
    default: 'processing'
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  contactNumber: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  shippedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  trackingCarrier: {
    type: String,
    trim: true
  },
  trackingUrl: {
    type: String,
    trim: true
  },
  trackingUpdatedAt: {
    type: Date
  },
  stockRestoredAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate order number before validation so required validation passes
orderSchema.pre('validate', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
