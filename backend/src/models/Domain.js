import { DOMAIN_STATUS } from '../constants/enums.js';
import mongoose from 'mongoose';

const domainSchema = new mongoose.Schema(
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
    },
    domainName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    tld: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    registrar: {
      type: String,
      required: true,
      enum: ['godaddy', 'namecheap', 'other'],
      default: 'godaddy',
    },
    registrarDomainId: {
      type: String,
      sparse: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(DOMAIN_STATUS),
      default: DOMAIN_STATUS.PENDING,
      index: true,
    },
    registrationDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
      index: true,
    },
    renewalDate: {
      type: Date,
      index: true,
    },
    autoRenew: {
      type: Boolean,
      default: true,
      index: true,
    },
    yearsPurchased: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 1,
    },
    registrationPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    renewalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    transferPrice: {
      type: Number,
      min: 0,
    },
    nameservers: [
      {
        type: String,
        trim: true,
      },
    ],
    dnsRecords: [
      {
        type: {
          type: String,
          enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'],
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
        ttl: {
          type: Number,
          default: 3600,
        },
        priority: {
          type: Number,
          default: 0,
        },
      },
    ],
    whoisPrivacy: {
      enabled: {
        type: Boolean,
        default: false,
      },
      price: {
        type: Number,
        default: 0,
      },
    },
    transferLock: {
      type: Boolean,
      default: true,
    },
    authCode: {
      type: String,
      select: false, // Don't return by default for security
    },
    contactInfo: {
      registrant: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        organization: String,
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          postalCode: String,
        },
      },
      admin: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        organization: String,
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          postalCode: String,
        },
      },
      technical: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        organization: String,
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          postalCode: String,
        },
      },
      billing: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        organization: String,
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          postalCode: String,
        },
      },
    },
    suspensionReason: {
      type: String,
    },
    suspendedAt: {
      type: Date,
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
domainSchema.index({ clientId: 1, status: 1 });
domainSchema.index({ expiryDate: 1, autoRenew: 1 });
domainSchema.index({ status: 1, expiryDate: 1 });
domainSchema.index({ registrar: 1, registrarDomainId: 1 });

// Virtuals
domainSchema.virtual('isExpired').get(function () {
  return this.expiryDate && this.expiryDate < new Date();
});

domainSchema.virtual('daysUntilExpiry').get(function () {
  if (!this.expiryDate) return null;
  const diffTime = this.expiryDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

domainSchema.virtual('isExpiringSoon').get(function () {
  const days = this.daysUntilExpiry;
  return days !== null && days > 0 && days <= 30;
});

// Methods
domainSchema.methods.canRenew = function () {
  return [DOMAIN_STATUS.ACTIVE, DOMAIN_STATUS.EXPIRING_SOON].includes(this.status);
};

domainSchema.methods.canTransfer = function () {
  return (
    this.status === DOMAIN_STATUS.ACTIVE &&
    !this.transferLock &&
    this.registrationDate &&
    new Date() - this.registrationDate > 60 * 24 * 60 * 60 * 1000 // 60 days
  );
};

domainSchema.methods.updateStatus = function () {
  if (this.expiryDate) {
    const daysUntilExpiry = this.daysUntilExpiry;
    
    if (daysUntilExpiry < 0) {
      this.status = DOMAIN_STATUS.EXPIRED;
    } else if (daysUntilExpiry <= 30) {
      this.status = DOMAIN_STATUS.EXPIRING_SOON;
    } else if (this.status === DOMAIN_STATUS.PENDING && this.registrationDate) {
      this.status = DOMAIN_STATUS.ACTIVE;
    }
  }
};

// Pre-save hook
domainSchema.pre('save', function (next) {
  if (this.isModified('expiryDate') || this.isModified('registrationDate')) {
    this.updateStatus();
  }
  next();
});

const Domain = mongoose.model('Domain', domainSchema);

export default Domain;
