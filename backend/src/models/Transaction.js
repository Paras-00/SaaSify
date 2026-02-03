import { PAYMENT_GATEWAY, TRANSACTION_STATUS, TRANSACTION_TYPE } from '../constants/enums.js';

import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
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
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(TRANSACTION_TYPE),
      index: true,
    },
    gateway: {
      type: String,
      required: true,
      enum: Object.values(PAYMENT_GATEWAY),
      index: true,
    },
    gatewayTransactionId: {
      type: String,
      index: true,
    },
    gatewayOrderId: {
      type: String,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING,
      index: true,
    },
    description: {
      type: String,
    },
    paymentDetails: {
      method: String, // card, upi, netbanking, wallet
      cardBrand: String, // visa, mastercard, amex
      cardLast4: String,
      cardCountry: String,
      upiId: String,
      bankName: String,
      walletName: String,
    },
    billingDetails: {
      email: String,
      phone: String,
      name: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
      },
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      select: false, // Don't return by default
    },
    errorCode: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundTransactionId: {
      type: String,
    },
    refundReason: {
      type: String,
    },
    refundedAt: {
      type: Date,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    webhookReceived: {
      type: Boolean,
      default: false,
    },
    webhookReceivedAt: {
      type: Date,
    },
    reconciled: {
      type: Boolean,
      default: false,
      index: true,
    },
    reconciledAt: {
      type: Date,
    },
    reconciledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
    },
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
transactionSchema.index({ clientId: 1, status: 1 });
transactionSchema.index({ gateway: 1, gatewayTransactionId: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ invoiceId: 1, status: 1 });
transactionSchema.index({ reconciled: 1, status: 1 });

// Virtuals
transactionSchema.virtual('isSuccessful').get(function () {
  return this.status === TRANSACTION_STATUS.SUCCESS;
});

transactionSchema.virtual('isFailed').get(function () {
  return this.status === TRANSACTION_STATUS.FAILED;
});

transactionSchema.virtual('isPending').get(function () {
  return this.status === TRANSACTION_STATUS.PENDING;
});

transactionSchema.virtual('isRefunded').get(function () {
  return this.status === TRANSACTION_STATUS.REFUNDED;
});

transactionSchema.virtual('isPartiallyRefunded').get(function () {
  return this.refundedAmount > 0 && this.refundedAmount < this.amount;
});

transactionSchema.virtual('refundableAmount').get(function () {
  if (!this.isSuccessful) return 0;
  return this.amount - this.refundedAmount;
});

// Pre-save hooks
transactionSchema.pre('save', function (next) {
  // Calculate net amount (amount - fee)
  if (this.isModified('amount') || this.isModified('fee')) {
    this.netAmount = this.amount - (this.fee || 0);
  }
  next();
});

// Methods
transactionSchema.methods.markAsSuccess = async function (gatewayResponse = {}) {
  this.status = TRANSACTION_STATUS.SUCCESS;
  this.gatewayResponse = gatewayResponse;
  this.webhookReceived = true;
  this.webhookReceivedAt = new Date();
  await this.save();
};

transactionSchema.methods.markAsFailed = async function (errorCode, errorMessage) {
  this.status = TRANSACTION_STATUS.FAILED;
  this.errorCode = errorCode;
  this.errorMessage = errorMessage;
  await this.save();
};

transactionSchema.methods.refund = async function (amount, reason, refundTransactionId) {
  if (!this.isSuccessful) {
    throw new Error('Can only refund successful transactions');
  }
  
  const refundAmount = amount || this.refundableAmount;
  
  if (refundAmount > this.refundableAmount) {
    throw new Error('Refund amount exceeds refundable amount');
  }
  
  this.refundedAmount += refundAmount;
  this.refundReason = reason;
  this.refundTransactionId = refundTransactionId;
  this.refundedAt = new Date();
  
  if (this.refundedAmount >= this.amount) {
    this.status = TRANSACTION_STATUS.REFUNDED;
  }
  
  await this.save();
};

transactionSchema.methods.reconcile = async function (reconciledBy) {
  if (this.reconciled) {
    throw new Error('Transaction is already reconciled');
  }
  
  this.reconciled = true;
  this.reconciledAt = new Date();
  this.reconciledBy = reconciledBy;
  await this.save();
};

transactionSchema.methods.canRefund = function () {
  return this.isSuccessful && this.refundableAmount > 0;
};

// Static methods
transactionSchema.statics.generateTransactionId = async function (gateway) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const prefix = `TXN${year}${month}${day}`;
  
  const lastTransaction = await this.findOne({
    transactionId: new RegExp(`^${prefix}`),
  })
    .sort({ transactionId: -1 })
    .select('transactionId');
  
  let sequence = 1;
  if (lastTransaction) {
    const lastSequence = parseInt(lastTransaction.transactionId.slice(-6));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(6, '0')}`;
};

transactionSchema.statics.findByClient = function (clientId, status = null) {
  const query = { clientId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

transactionSchema.statics.findSuccessfulTransactions = function (startDate, endDate) {
  const query = {
    status: TRANSACTION_STATUS.SUCCESS,
  };
  
  if (startDate && endDate) {
    query.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

transactionSchema.statics.findPendingTransactions = function (olderThanMinutes = 30) {
  const cutoffDate = new Date();
  cutoffDate.setMinutes(cutoffDate.getMinutes() - olderThanMinutes);
  
  return this.find({
    status: TRANSACTION_STATUS.PENDING,
    createdAt: { $lte: cutoffDate },
  });
};

transactionSchema.statics.findUnreconciledTransactions = function () {
  return this.find({
    status: TRANSACTION_STATUS.SUCCESS,
    reconciled: false,
  }).sort({ createdAt: 1 });
};

transactionSchema.statics.getRevenueStats = async function (startDate, endDate) {
  const matchStage = {
    status: TRANSACTION_STATUS.SUCCESS,
    type: { $in: [TRANSACTION_TYPE.PAYMENT, TRANSACTION_TYPE.WALLET_TOPUP] },
  };
  
  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  const result = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalFees: { $sum: '$fee' },
        netRevenue: { $sum: '$netAmount' },
        transactionCount: { $sum: 1 },
        avgTransactionAmount: { $avg: '$amount' },
      },
    },
  ]);
  
  return result.length > 0 ? result[0] : {
    totalRevenue: 0,
    totalFees: 0,
    netRevenue: 0,
    transactionCount: 0,
    avgTransactionAmount: 0,
  };
};

transactionSchema.statics.getGatewayStats = async function (startDate, endDate) {
  const matchStage = {
    status: TRANSACTION_STATUS.SUCCESS,
  };
  
  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$gateway',
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fee' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
