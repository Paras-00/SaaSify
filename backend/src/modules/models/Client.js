import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  taxId: {
    type: String,
    default: '',
  },
  currency: {
    type: String,
    default: 'USD',
  },
  language: {
    type: String,
    default: 'en',
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Indexes
ClientSchema.index({ userId: 1 }, { unique: true });
ClientSchema.index({ status: 1 });
ClientSchema.index({ email: 1 });

// Virtual for full name
ClientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model('Client', ClientSchema);
