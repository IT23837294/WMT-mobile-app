const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const deliveryAddressSchema = new mongoose.Schema({
  label: {
    type: String,
    enum: ['Home', 'Work', 'Other'],
    default: 'Home'
  },
  street: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: 'India'
  },
  deliveryInstructions: {
    type: String,
    trim: true,
    default: ''
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['customer', 'pharmacist', 'admin', 'supplier', 'support_officer'],
    default: 'customer'
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: (value) => !value || /^\d{10}$/.test(String(value).trim()),
      message: 'Phone number must contain exactly 10 digits'
    }
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' }
  },
  addressBook: [deliveryAddressSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('validate', function(next) {
  const addressBook = Array.isArray(this.addressBook) ? this.addressBook.filter(Boolean) : [];

  if (addressBook.length > 0) {
    const hasExplicitDefault = addressBook.some((entry) => entry.isDefault);
    const normalizedAddressBook = addressBook.map((entry, index) => ({
      ...(entry.toObject?.() || entry),
      isDefault: hasExplicitDefault ? Boolean(entry.isDefault) : index === 0
    }));

    const defaultAddress = normalizedAddressBook.find((entry) => entry.isDefault) || normalizedAddressBook[0];

    this.addressBook = normalizedAddressBook;
    this.address = {
      street: defaultAddress.street || '',
      city: defaultAddress.city || '',
      state: defaultAddress.state || '',
      zipCode: defaultAddress.zipCode || '',
      country: defaultAddress.country || 'India'
    };
  }

  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
