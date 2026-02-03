import { BILLING_CYCLE, PRODUCT_TYPE } from '../../constants/enums.js';

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(PRODUCT_TYPE),
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    features: [
      {
        name: String,
        value: String,
        highlight: {
          type: Boolean,
          default: false,
        },
      },
    ],
    pricing: {
      monthly: {
        price: { type: Number, min: 0 },
        setupFee: { type: Number, min: 0, default: 0 },
      },
      quarterly: {
        price: { type: Number, min: 0 },
        setupFee: { type: Number, min: 0, default: 0 },
      },
      semiannually: {
        price: { type: Number, min: 0 },
        setupFee: { type: Number, min: 0, default: 0 },
      },
      annually: {
        price: { type: Number, min: 0 },
        setupFee: { type: Number, min: 0, default: 0 },
      },
      biennially: {
        price: { type: Number, min: 0 },
        setupFee: { type: Number, min: 0, default: 0 },
      },
      triennially: {
        price: { type: Number, min: 0 },
        setupFee: { type: Number, min: 0, default: 0 },
      },
    },
    // Domain-specific fields
    tld: {
      type: String,
      lowercase: true,
    },
    registrationYears: {
      type: [Number],
      default: [1, 2, 3, 5, 10],
    },
    // Hosting-specific fields
    resources: {
      diskSpace: { type: String }, // e.g., "10GB", "Unlimited"
      bandwidth: { type: String }, // e.g., "100GB", "Unlimited"
      databases: { type: String }, // e.g., "10", "Unlimited"
      emailAccounts: { type: String }, // e.g., "50", "Unlimited"
      subdomains: { type: String }, // e.g., "25", "Unlimited"
      ftpAccounts: { type: String },
      cpuCores: { type: String },
      ram: { type: String },
      ssdStorage: { type: String },
    },
    serverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      index: true,
    },
    autoSetup: {
      type: Boolean,
      default: true,
    },
    setupType: {
      type: String,
      enum: ['automatic', 'manual', 'approval'],
      default: 'automatic',
    },
    provisioningModule: {
      type: String,
      enum: ['cpanel', 'plesk', 'directadmin', 'aws', 'digitalocean', 'custom'],
    },
    configOptions: [
      {
        name: String,
        label: String,
        type: {
          type: String,
          enum: ['select', 'text', 'number', 'checkbox', 'radio'],
        },
        options: [String],
        required: {
          type: Boolean,
          default: false,
        },
        defaultValue: mongoose.Schema.Types.Mixed,
      },
    ],
    stockControl: {
      enabled: {
        type: Boolean,
        default: false,
      },
      quantity: {
        type: Number,
        min: 0,
      },
      notifyAtLevel: {
        type: Number,
        min: 0,
      },
    },
    orderSettings: {
      minQuantity: {
        type: Number,
        min: 1,
        default: 1,
      },
      maxQuantity: {
        type: Number,
        min: 1,
      },
    },
    welcomeEmail: {
      enabled: {
        type: Boolean,
        default: true,
      },
      template: {
        type: String,
        default: 'service-activated',
      },
    },
    taxable: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
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
productSchema.index({ type: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, displayOrder: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtuals
productSchema.virtual('services', {
  ref: 'Service',
  localField: '_id',
  foreignField: 'productId',
});

productSchema.virtual('lowestPrice').get(function () {
  const prices = [];
  
  Object.values(BILLING_CYCLE).forEach((cycle) => {
    const cycleKey = cycle.toLowerCase().replace(/-/g, '');
    if (this.pricing[cycleKey]?.price) {
      prices.push(this.pricing[cycleKey].price);
    }
  });
  
  return prices.length > 0 ? Math.min(...prices) : 0;
});

productSchema.virtual('isInStock').get(function () {
  if (!this.stockControl.enabled) return true;
  return this.stockControl.quantity > 0;
});

productSchema.virtual('isLowStock').get(function () {
  if (!this.stockControl.enabled) return false;
  return (
    this.stockControl.quantity <= this.stockControl.notifyAtLevel &&
    this.stockControl.quantity > 0
  );
});

// Methods
productSchema.methods.getPriceForCycle = function (billingCycle) {
  const cycleKey = billingCycle.toLowerCase().replace(/-/g, '');
  return this.pricing[cycleKey]?.price || 0;
};

productSchema.methods.getSetupFeeForCycle = function (billingCycle) {
  const cycleKey = billingCycle.toLowerCase().replace(/-/g, '');
  return this.pricing[cycleKey]?.setupFee || 0;
};

productSchema.methods.decrementStock = async function (quantity = 1) {
  if (!this.stockControl.enabled) return true;
  
  if (this.stockControl.quantity < quantity) {
    throw new Error('Insufficient stock');
  }
  
  this.stockControl.quantity -= quantity;
  await this.save();
  return true;
};

productSchema.methods.incrementStock = async function (quantity = 1) {
  if (!this.stockControl.enabled) return true;
  
  this.stockControl.quantity += quantity;
  await this.save();
  return true;
};

// Static methods
productSchema.statics.findActiveProducts = function (type = null) {
  const query = { isActive: true };
  if (type) query.type = type;
  return this.find(query).sort({ displayOrder: 1, name: 1 });
};

productSchema.statics.findFeaturedProducts = function () {
  return this.find({ isActive: true, isFeatured: true })
    .sort({ displayOrder: 1, name: 1 })
    .limit(6);
};

const Product = mongoose.model('Product', productSchema);

export default Product;
