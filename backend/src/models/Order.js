import { BILLING_CYCLE, ORDER_STATUS } from '../constants/enums.js';

import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    items: [
      {
        type: {
          type: String,
          enum: ['domain', 'hosting', 'addon'],
          required: true,
        },
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        domainName: {
          type: String,
          lowercase: true,
          trim: true,
        },
        description: {
          type: String,
          required: true,
        },
        billingCycle: {
          type: String,
          enum: Object.values(BILLING_CYCLE),
        },
        quantity: {
          type: Number,
          min: 1,
          default: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        setupFee: {
          type: Number,
          default: 0,
          min: 0,
        },
        discount: {
          type: Number,
          default: 0,
          min: 0,
        },
        taxAmount: {
          type: Number,
          default: 0,
          min: 0,
        },
        total: {
          type: Number,
          required: true,
          min: 0,
        },
        configOptions: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
        },
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Service',
        },
        domainId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Domain',
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalSetupFees: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    promoCode: {
      code: String,
      discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
      },
      discountValue: Number,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe', 'wallet', 'bank-transfer', 'manual'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partial'],
      default: 'pending',
      index: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAt: {
      type: Date,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      index: true,
    },
    fraudCheck: {
      score: Number,
      status: {
        type: String,
        enum: ['passed', 'review', 'failed'],
        default: 'passed',
      },
      details: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    notes: {
      admin: String,
      client: String,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(ORDER_STATUS),
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
orderSchema.index({ clientId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ 'fraudCheck.status': 1 });

// Virtuals
orderSchema.virtual('isPaid').get(function () {
  return this.paymentStatus === 'paid';
});

orderSchema.virtual('isPartiallyPaid').get(function () {
  return this.paidAmount > 0 && this.paidAmount < this.total;
});

orderSchema.virtual('outstandingAmount').get(function () {
  return Math.max(0, this.total - this.paidAmount);
});

orderSchema.virtual('hasDiscount').get(function () {
  return this.totalDiscount > 0;
});

// Pre-save hooks
orderSchema.pre('save', function (next) {
  // Calculate totals
  if (this.isModified('items')) {
    this.subtotal = this.items.reduce((sum, item) => {
      return sum + item.unitPrice * item.quantity;
    }, 0);
    
    this.totalSetupFees = this.items.reduce((sum, item) => {
      return sum + (item.setupFee || 0) * item.quantity;
    }, 0);
    
    this.totalDiscount = this.items.reduce((sum, item) => {
      return sum + (item.discount || 0);
    }, 0);
    
    this.totalTax = this.items.reduce((sum, item) => {
      return sum + (item.taxAmount || 0);
    }, 0);
    
    this.total = this.subtotal + this.totalSetupFees - this.totalDiscount + this.totalTax;
  }
  
  next();
});

// Methods
orderSchema.methods.addStatusHistory = function (status, changedBy, reason = '') {
  this.statusHistory.push({
    status,
    changedBy,
    reason,
    timestamp: new Date(),
  });
};

orderSchema.methods.markAsPaid = async function (transactionId, paidAmount = null) {
  this.paymentStatus = 'paid';
  this.paidAmount = paidAmount || this.total;
  this.paidAt = new Date();
  
  if (this.status === ORDER_STATUS.PENDING) {
    this.status = ORDER_STATUS.PAID;
    this.addStatusHistory(ORDER_STATUS.PAID, null, 'Payment received');
  }
  
  await this.save();
};

orderSchema.methods.markAsActive = async function () {
  this.status = ORDER_STATUS.ACTIVE;
  this.addStatusHistory(ORDER_STATUS.ACTIVE, null, 'Services activated');
  await this.save();
};

orderSchema.methods.cancel = async function (reason, cancelledBy) {
  if (this.status === ORDER_STATUS.CANCELLED) {
    throw new Error('Order is already cancelled');
  }
  
  this.status = ORDER_STATUS.CANCELLED;
  this.addStatusHistory(ORDER_STATUS.CANCELLED, cancelledBy, reason);
  await this.save();
};

orderSchema.methods.refund = async function (amount, reason, refundedBy) {
  if (this.paidAmount === 0) {
    throw new Error('No payment to refund');
  }
  
  const refundAmount = amount || this.paidAmount;
  
  if (refundAmount > this.paidAmount) {
    throw new Error('Refund amount exceeds paid amount');
  }
  
  this.paidAmount -= refundAmount;
  
  if (this.paidAmount === 0) {
    this.paymentStatus = 'refunded';
    this.status = ORDER_STATUS.REFUNDED;
    this.addStatusHistory(ORDER_STATUS.REFUNDED, refundedBy, reason);
  } else {
    this.paymentStatus = 'partial';
  }
  
  await this.save();
};

// Static methods
orderSchema.statics.generateOrderNumber = async function () {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `ORD${year}${month}`;
  
  const lastOrder = await this.findOne({
    orderNumber: new RegExp(`^${prefix}`),
  })
    .sort({ orderNumber: -1 })
    .select('orderNumber');
  
  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.slice(-6));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(6, '0')}`;
};

orderSchema.statics.findPendingOrders = function () {
  return this.find({
    status: ORDER_STATUS.PENDING,
    paymentStatus: 'pending',
  }).sort({ createdAt: -1 });
};

orderSchema.statics.findByClient = function (clientId, status = null) {
  const query = { clientId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
