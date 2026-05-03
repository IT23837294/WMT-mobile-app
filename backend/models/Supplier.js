const mongoose = require('mongoose');

const supplierPriceHistorySchema = new mongoose.Schema({
  unitPrice: {
    type: Number,
    min: [0, 'Unit price cannot be negative'],
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const supplierCatalogItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  unitPrice: {
    type: Number,
    min: [0, 'Unit price cannot be negative'],
    required: true
  },
  moq: {
    type: Number,
    min: [1, 'MOQ must be at least 1'],
    default: 1
  },
  leadTime: {
    type: String,
    trim: true,
    default: ''
  },
  priceHistory: [supplierPriceHistorySchema]
});

const supplierInvoiceSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: [true, 'Invoice number is required'],
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    min: [0, 'Invoice amount cannot be negative'],
    required: true
  },
  amountPaid: {
    type: Number,
    min: [0, 'Paid amount cannot be negative'],
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid'],
    default: 'unpaid'
  },
  attachmentUrl: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

const supplierSchema = new mongoose.Schema({
  companyName: {
    type: String,
    trim: true,
    maxlength: [150, 'Company name cannot be more than 150 characters'],
    default: ''
  },
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  contact: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' }
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  supplyStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  products: [{
    type: String,
    trim: true
  }],
  deliveryPricePerItem: {
    type: Number,
    min: [0, 'Delivery price per item cannot be negative'],
    default: null
  },
  suppliedItems: [supplierCatalogItemSchema],
  returnPolicy: {
    acceptsDamagedReturns: {
      type: Boolean,
      default: false
    },
    acceptsExpiredExchanges: {
      type: Boolean,
      default: false
    }
  },
  deliveryCommitment: {
    deliversOnTime: {
      type: Boolean,
      default: false
    }
  },
  preferredSupplier: {
    type: Boolean,
    default: false
  },
  performance: {
    onTimeDeliveryRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    orderAccuracyRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    qualityIssueCount: {
      type: Number,
      min: 0,
      default: 0
    },
    returnCount: {
      type: Number,
      min: 0,
      default: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  invoices: [supplierInvoiceSchema],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

supplierSchema.pre('validate', function(next) {
  const performance = this.performance || {};
  const onTimeDeliveryRate = Number(performance.onTimeDeliveryRate || 0);
  const orderAccuracyRate = Number(performance.orderAccuracyRate || 0);
  const qualityIssueCount = Number(performance.qualityIssueCount || 0);
  const returnCount = Number(performance.returnCount || 0);
  const issuePenalty = Math.min(100, (qualityIssueCount * 5) + (returnCount * 5));
  const weightedScore = (onTimeDeliveryRate * 0.45) + (orderAccuracyRate * 0.4) + ((100 - issuePenalty) * 0.15);

  this.performance = {
    ...performance,
    onTimeDeliveryRate,
    orderAccuracyRate,
    qualityIssueCount,
    returnCount,
    rating: Math.max(0, Math.min(5, Number((weightedScore / 20).toFixed(1))))
  };

  this.invoices = (this.invoices || []).map((invoice) => {
    const amount = Number(invoice.amount || 0);
    const amountPaid = Number(invoice.amountPaid || 0);
    let paymentStatus = 'unpaid';

    if (amountPaid >= amount && amount > 0) {
      paymentStatus = 'paid';
    } else if (amountPaid > 0) {
      paymentStatus = 'partially_paid';
    }

    return {
      ...invoice.toObject?.() || invoice,
      amount,
      amountPaid,
      paymentStatus
    };
  });

  next();
});

module.exports = mongoose.model('Supplier', supplierSchema);
