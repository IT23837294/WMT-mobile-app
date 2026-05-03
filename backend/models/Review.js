const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    default: null
  },
  reviewType: {
    type: String,
    enum: ['medicine', 'service'],
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Review comment cannot be more than 500 characters'],
    default: ''
  }
}, {
  timestamps: true
});

reviewSchema.index({ user: 1, order: 1, medicine: 1, reviewType: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
