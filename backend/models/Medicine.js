const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative'],
    default: 0
  },
  sellingPrice: {
    type: Number,
    min: [0, 'Selling price cannot be negative']
  },
  profitAmount: {
    type: Number,
    default: 0
  },
  profitMargin: {
    type: Number,
    default: 0
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  thresholdValue: {
    type: Number,
    min: [1, 'Reorder level must be at least 1'],
    default: 10
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  manufacturer: {
    type: String,
    trim: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  dosage: {
    type: String,
    trim: true
  },
  strength: {
    type: String,
    trim: true
  },
  batchNo: {
    type: String,
    trim: true
  },
  sideEffects: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

medicineSchema.pre('validate', function(next) {
  const sellingPrice = this.sellingPrice ?? this.price;
  const costPrice = this.costPrice ?? 0;

  this.sellingPrice = sellingPrice;
  this.price = sellingPrice;
  this.profitAmount = sellingPrice - costPrice;
  this.profitMargin = costPrice > 0 ? (this.profitAmount / costPrice) * 100 : 0;

  next();
});

// Virtual for checking if stock is low
medicineSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity <= (this.thresholdValue || 10);
});

// Virtual for checking if expired
medicineSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Virtual for checking if near expiry (within 30 days)
medicineSchema.virtual('isNearExpiry').get(function() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return new Date() < this.expiryDate && this.expiryDate <= thirtyDaysFromNow;
});

medicineSchema.set('toJSON', { virtuals: true });
medicineSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Medicine', medicineSchema);
