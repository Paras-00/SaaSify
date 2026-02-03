import { INVOICE_STATUS } from '../constants/enums.js';
import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
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
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    items: [
      {
        type: {
          type: String,
          enum: ['service', 'domain', 'addon', 'setup-fee', 'credit', 'other'],
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Service',
        },
        domainId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Domain',
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
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
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit: {
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
    status: {
      type: String,
      required: true,
      enum: Object.values(INVOICE_STATUS),
      default: INVOICE_STATUS.UNPAID,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe', 'wallet', 'bank-transfer', 'manual', 'credit'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAt: {
      type: Date,
    },
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],
    notes: {
      public: String, // Visible to client
      admin: String, // Internal notes
    },
    taxInfo: {
      taxRate: Number,
      taxName: String,
      taxNumber: String,
      taxableAmount: Number,
    },
    billingAddress: {
      firstName: String,
      lastName: String,
      company: String,
      address: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      phone: String,
      email: String,
    },
    remindersSent: {
      type: Number,
      default: 0,
    },
    lastReminderDate: {
      type: Date,
    },
    overdueNoticeSent: {
      type: Boolean,
      default: false,
    },
    pdfPath: {
      type: String,
    },
    pdfGenerated: {
      type: Boolean,
      default: false,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(INVOICE_STATUS),
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
invoiceSchema.index({ clientId: 1, status: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ invoiceDate: 1 });
invoiceSchema.index({ status: 1, remindersSent: 1 });

// Virtuals
invoiceSchema.virtual('isPaid').get(function () {
  return this.status === INVOICE_STATUS.PAID;
});

invoiceSchema.virtual('isOverdue').get(function () {
  return (
    this.status === INVOICE_STATUS.UNPAID &&
    this.dueDate < new Date()
  );
});

invoiceSchema.virtual('daysOverdue').get(function () {
  if (!this.isOverdue) return 0;
  const diffTime = new Date() - this.dueDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

invoiceSchema.virtual('daysUntilDue').get(function () {
  if (this.isPaid) return 0;
  const diffTime = this.dueDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

invoiceSchema.virtual('outstandingAmount').get(function () {
  return Math.max(0, this.total - this.paidAmount);
});

invoiceSchema.virtual('isPartiallyPaid').get(function () {
  return this.paidAmount > 0 && this.paidAmount < this.total;
});

// Pre-save hooks
invoiceSchema.pre('save', function (next) {
  // Calculate totals
  if (this.isModified('items')) {
    this.subtotal = this.items.reduce((sum, item) => {
      return sum + item.unitPrice * item.quantity;
    }, 0);
    
    this.totalDiscount = this.items.reduce((sum, item) => {
      return sum + (item.discount || 0);
    }, 0);
    
    this.totalTax = this.items.reduce((sum, item) => {
      return sum + (item.taxAmount || 0);
    }, 0);
    
    this.total = this.subtotal - this.totalDiscount - (this.credit || 0) + this.totalTax;
    this.total = Math.max(0, this.total); // Ensure non-negative
  }
  
  // Update status based on payment
  if (this.isModified('paidAmount')) {
    if (this.paidAmount >= this.total) {
      this.status = INVOICE_STATUS.PAID;
      if (!this.paidAt) {
        this.paidAt = new Date();
      }
    } else if (this.paidAmount > 0) {
      this.status = INVOICE_STATUS.PARTIALLY_PAID;
    }
  }
  
  next();
});

// Methods
invoiceSchema.methods.addStatusHistory = function (status, changedBy, reason = '') {
  this.statusHistory.push({
    status,
    changedBy,
    reason,
    timestamp: new Date(),
  });
};

invoiceSchema.methods.markAsPaid = async function (transactionId, paidAmount = null) {
  const amount = paidAmount || this.total;
  
  this.paidAmount += amount;
  this.paidAt = new Date();
  
  if (this.paidAmount >= this.total) {
    this.status = INVOICE_STATUS.PAID;
    this.addStatusHistory(INVOICE_STATUS.PAID, null, 'Payment received');
  } else {
    this.status = INVOICE_STATUS.PARTIALLY_PAID;
  }
  
  if (transactionId) {
    this.transactions.push(transactionId);
  }
  
  await this.save();
};

invoiceSchema.methods.cancel = async function (reason, cancelledBy) {
  if (this.status === INVOICE_STATUS.CANCELLED) {
    throw new Error('Invoice is already cancelled');
  }
  
  if (this.status === INVOICE_STATUS.PAID) {
    throw new Error('Cannot cancel a paid invoice');
  }
  
  this.status = INVOICE_STATUS.CANCELLED;
  this.addStatusHistory(INVOICE_STATUS.CANCELLED, cancelledBy, reason);
  await this.save();
};

invoiceSchema.methods.refund = async function (amount, reason, refundedBy) {
  if (this.paidAmount === 0) {
    throw new Error('No payment to refund');
  }
  
  const refundAmount = amount || this.paidAmount;
  
  if (refundAmount > this.paidAmount) {
    throw new Error('Refund amount exceeds paid amount');
  }
  
  this.paidAmount -= refundAmount;
  
  if (this.paidAmount === 0) {
    this.status = INVOICE_STATUS.REFUNDED;
    this.paidAt = null;
    this.addStatusHistory(INVOICE_STATUS.REFUNDED, refundedBy, reason);
  } else {
    this.status = INVOICE_STATUS.PARTIALLY_PAID;
  }
  
  await this.save();
};

invoiceSchema.methods.applyCredit = async function (creditAmount) {
  if (creditAmount <= 0) {
    throw new Error('Credit amount must be positive');
  }
  
  this.credit = (this.credit || 0) + creditAmount;
  this.total = Math.max(0, this.subtotal - this.totalDiscount - this.credit + this.totalTax);
  
  if (this.total === 0) {
    this.status = INVOICE_STATUS.PAID;
    this.paymentMethod = 'credit';
    this.paidAmount = this.subtotal - this.totalDiscount + this.totalTax;
    this.paidAt = new Date();
    this.addStatusHistory(INVOICE_STATUS.PAID, null, 'Paid via credit');
  }
  
  await this.save();
};

invoiceSchema.methods.sendReminder = async function () {
  this.remindersSent += 1;
  this.lastReminderDate = new Date();
  await this.save();
};

invoiceSchema.methods.sendOverdueNotice = async function () {
  this.overdueNoticeSent = true;
  await this.save();
};

// Static methods
invoiceSchema.statics.generateInvoiceNumber = async function () {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `INV${year}${month}`;
  
  const lastInvoice = await this.findOne({
    invoiceNumber: new RegExp(`^${prefix}`),
  })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber');
  
  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.slice(-6));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(6, '0')}`;
};

invoiceSchema.statics.findOverdueInvoices = function (daysOverdue = 0) {
  const overdueDate = new Date();
  if (daysOverdue > 0) {
    overdueDate.setDate(overdueDate.getDate() - daysOverdue);
  }
  
  return this.find({
    status: { $in: [INVOICE_STATUS.UNPAID, INVOICE_STATUS.PARTIALLY_PAID] },
    dueDate: { $lte: overdueDate },
  }).sort({ dueDate: 1 });
};

invoiceSchema.statics.findDueForReminder = function () {
  const reminderDate = new Date();
  reminderDate.setDate(reminderDate.getDate() + 3); // 3 days before due
  
  return this.find({
    status: INVOICE_STATUS.UNPAID,
    dueDate: { $lte: reminderDate, $gte: new Date() },
    remindersSent: { $lt: 3 },
  });
};

invoiceSchema.statics.findByClient = function (clientId, status = null) {
  const query = { clientId };
  if (status) query.status = status;
  return this.find(query).sort({ invoiceDate: -1 });
};

invoiceSchema.statics.getClientBalance = async function (clientId) {
  const result = await this.aggregate([
    {
      $match: {
        clientId: mongoose.Types.ObjectId(clientId),
        status: { $in: [INVOICE_STATUS.UNPAID, INVOICE_STATUS.PARTIALLY_PAID] },
      },
    },
    {
      $group: {
        _id: null,
        totalDue: { $sum: { $subtract: ['$total', '$paidAmount'] } },
      },
    },
  ]);
  
  return result.length > 0 ? result[0].totalDue : 0;
};

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
