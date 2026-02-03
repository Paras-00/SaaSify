import { BILLING_CYCLE, SERVICE_STATUS } from '../constants/enums.js';

import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    serverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      index: true,
    },
    domainName: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: false, // Don't return by default for security
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(SERVICE_STATUS),
      default: SERVICE_STATUS.PENDING,
      index: true,
    },
    billingCycle: {
      type: String,
      required: true,
      enum: Object.values(BILLING_CYCLE),
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    setupFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextDueDate: {
      type: Date,
      index: true,
    },
    nextInvoiceDate: {
      type: Date,
      index: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    activationDate: {
      type: Date,
    },
    suspensionDate: {
      type: Date,
    },
    terminationDate: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: true,
      index: true,
    },
    renewalEnabled: {
      type: Boolean,
      default: true,
    },
    overrideAutoSuspend: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      enum: ['non-payment', 'abuse', 'admin', 'resource-exceeded', 'manual'],
    },
    terminationReason: {
      type: String,
    },
    provisioningDetails: {
      provider: {
        type: String,
        enum: ['cpanel', 'plesk', 'directadmin', 'aws', 'digitalocean', 'custom'],
      },
      accountId: String,
      serverId: String,
      ipAddress: String,
      hostname: String,
      packageName: String,
      plan: String,
      instanceId: String,
      region: String,
      additionalInfo: mongoose.Schema.Types.Mixed,
    },
    configOptions: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    resources: {
      diskSpaceUsed: { type: Number, default: 0 }, // in MB
      diskSpaceLimit: { type: Number }, // in MB
      bandwidthUsed: { type: Number, default: 0 }, // in MB
      bandwidthLimit: { type: Number }, // in MB
      emailAccountsUsed: { type: Number, default: 0 },
      emailAccountsLimit: { type: Number },
      databasesUsed: { type: Number, default: 0 },
      databasesLimit: { type: Number },
      subdomainsUsed: { type: Number, default: 0 },
      subdomainsLimit: { type: Number },
    },
    accessDetails: {
      controlPanelUrl: String,
      ftpHost: String,
      ftpPort: { type: Number, default: 21 },
      sshEnabled: { type: Boolean, default: false },
      sshPort: { type: Number, default: 22 },
      databaseHost: String,
      databasePort: { type: Number, default: 3306 },
      nameservers: [String],
      phpVersion: String,
    },
    limits: {
      cpuPercent: Number,
      memoryMB: Number,
      processCount: Number,
      entryProcesses: Number,
      ioSpeed: Number,
      iops: Number,
    },
    addons: [
      {
        name: String,
        price: Number,
        billingCycle: String,
        active: { type: Boolean, default: true },
        activatedAt: Date,
      },
    ],
    backups: {
      enabled: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
      },
      retention: Number, // days
      lastBackupDate: Date,
      nextBackupDate: Date,
      backupLocation: String,
    },
    ssl: {
      enabled: { type: Boolean, default: false },
      type: {
        type: String,
        enum: ['lets-encrypt', 'custom', 'commercial'],
      },
      issuer: String,
      expiryDate: Date,
      autoRenew: { type: Boolean, default: true },
    },
    notes: {
      admin: String,
      client: String,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(SERVICE_STATUS),
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
serviceSchema.index({ clientId: 1, status: 1 });
serviceSchema.index({ status: 1, nextDueDate: 1 });
serviceSchema.index({ status: 1, nextInvoiceDate: 1 });
serviceSchema.index({ productId: 1, status: 1 });
serviceSchema.index({ serverId: 1, status: 1 });
serviceSchema.index({ 'provisioningDetails.provider': 1, 'provisioningDetails.accountId': 1 });

// Virtuals
serviceSchema.virtual('isOverdue').get(function () {
  return this.nextDueDate && this.nextDueDate < new Date() && this.status === SERVICE_STATUS.ACTIVE;
});

serviceSchema.virtual('daysUntilDue').get(function () {
  if (!this.nextDueDate) return null;
  const diffTime = this.nextDueDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

serviceSchema.virtual('isDueSoon').get(function () {
  const days = this.daysUntilDue;
  return days !== null && days > 0 && days <= 7;
});

serviceSchema.virtual('diskUsagePercent').get(function () {
  if (!this.resources.diskSpaceLimit || this.resources.diskSpaceLimit === 0) return 0;
  return ((this.resources.diskSpaceUsed / this.resources.diskSpaceLimit) * 100).toFixed(2);
});

serviceSchema.virtual('bandwidthUsagePercent').get(function () {
  if (!this.resources.bandwidthLimit || this.resources.bandwidthLimit === 0) return 0;
  return ((this.resources.bandwidthUsed / this.resources.bandwidthLimit) * 100).toFixed(2);
});

// Methods
serviceSchema.methods.addStatusHistory = function (status, changedBy, reason = '') {
  this.statusHistory.push({
    status,
    changedBy,
    reason,
    timestamp: new Date(),
  });
};

serviceSchema.methods.activate = async function (provisioningDetails = {}) {
  this.status = SERVICE_STATUS.ACTIVE;
  this.activationDate = new Date();
  this.provisioningDetails = { ...this.provisioningDetails, ...provisioningDetails };
  
  // Calculate next due date based on billing cycle
  this.calculateNextDueDate();
  
  this.addStatusHistory(SERVICE_STATUS.ACTIVE, null, 'Service activated');
  await this.save();
};

serviceSchema.methods.suspend = async function (reason, suspendedBy) {
  if (this.status === SERVICE_STATUS.SUSPENDED) {
    throw new Error('Service is already suspended');
  }
  
  this.status = SERVICE_STATUS.SUSPENDED;
  this.suspensionDate = new Date();
  this.suspensionReason = reason;
  this.addStatusHistory(SERVICE_STATUS.SUSPENDED, suspendedBy, reason);
  await this.save();
};

serviceSchema.methods.unsuspend = async function (unsuspendedBy) {
  if (this.status !== SERVICE_STATUS.SUSPENDED) {
    throw new Error('Service is not suspended');
  }
  
  this.status = SERVICE_STATUS.ACTIVE;
  this.suspensionDate = null;
  this.suspensionReason = null;
  this.addStatusHistory(SERVICE_STATUS.ACTIVE, unsuspendedBy, 'Service unsuspended');
  await this.save();
};

serviceSchema.methods.terminate = async function (reason, terminatedBy) {
  this.status = SERVICE_STATUS.TERMINATED;
  this.terminationDate = new Date();
  this.terminationReason = reason;
  this.addStatusHistory(SERVICE_STATUS.TERMINATED, terminatedBy, reason);
  await this.save();
};

serviceSchema.methods.calculateNextDueDate = function () {
  const currentDate = this.nextDueDate || this.activationDate || new Date();
  const date = new Date(currentDate);
  
  switch (this.billingCycle) {
    case BILLING_CYCLE.MONTHLY:
      date.setMonth(date.getMonth() + 1);
      break;
    case BILLING_CYCLE.QUARTERLY:
      date.setMonth(date.getMonth() + 3);
      break;
    case BILLING_CYCLE.SEMI_ANNUALLY:
      date.setMonth(date.getMonth() + 6);
      break;
    case BILLING_CYCLE.ANNUALLY:
      date.setFullYear(date.getFullYear() + 1);
      break;
    case BILLING_CYCLE.BIENNIALLY:
      date.setFullYear(date.getFullYear() + 2);
      break;
    case BILLING_CYCLE.TRIENNIALLY:
      date.setFullYear(date.getFullYear() + 3);
      break;
  }
  
  this.nextDueDate = date;
  
  // Set next invoice date (7 days before due date)
  const invoiceDate = new Date(date);
  invoiceDate.setDate(invoiceDate.getDate() - 7);
  this.nextInvoiceDate = invoiceDate;
};

serviceSchema.methods.updateResourceUsage = async function (resources) {
  this.resources = { ...this.resources, ...resources };
  await this.save();
};

// Static methods
serviceSchema.statics.findDueForInvoicing = function () {
  return this.find({
    status: { $in: [SERVICE_STATUS.ACTIVE, SERVICE_STATUS.SUSPENDED] },
    autoRenew: true,
    nextInvoiceDate: { $lte: new Date() },
  });
};

serviceSchema.statics.findDueForSuspension = function () {
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - 7); // 7 days overdue
  
  return this.find({
    status: SERVICE_STATUS.ACTIVE,
    nextDueDate: { $lte: overdueDate },
    overrideAutoSuspend: false,
  });
};

serviceSchema.statics.findDueForTermination = function () {
  const terminationDate = new Date();
  terminationDate.setDate(terminationDate.getDate() - 30); // 30 days after suspension
  
  return this.find({
    status: SERVICE_STATUS.SUSPENDED,
    suspensionDate: { $lte: terminationDate },
  });
};

serviceSchema.statics.findByClient = function (clientId, status = null) {
  const query = { clientId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

const Service = mongoose.model('Service', serviceSchema);

export default Service;
