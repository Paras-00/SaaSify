import { SERVER_TYPE } from '../../constants/enums.js';
import mongoose from 'mongoose';

const serverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    hostname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(SERVER_TYPE),
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['cpanel', 'plesk', 'directadmin', 'aws', 'digitalocean', 'custom'],
      index: true,
    },
    location: {
      datacenter: String,
      city: String,
      country: String,
      region: String,
    },
    // cPanel/Plesk/DirectAdmin specific
    controlPanel: {
      url: String,
      port: Number,
      username: String,
      apiToken: {
        type: String,
        select: false, // Don't return by default for security
      },
      apiKey: {
        type: String,
        select: false,
      },
      accessHash: {
        type: String,
        select: false,
      },
      whmUrl: String,
      whmPort: Number,
      nameservers: [String],
    },
    // AWS specific
    aws: {
      region: String,
      accessKeyId: {
        type: String,
        select: false,
      },
      secretAccessKey: {
        type: String,
        select: false,
      },
      ec2InstanceType: String,
      ami: String,
      securityGroupId: String,
      keyPairName: String,
    },
    // DigitalOcean specific
    digitalocean: {
      region: String,
      apiToken: {
        type: String,
        select: false,
      },
      dropletSize: String,
      imageSlug: String,
      vpcId: String,
    },
    resources: {
      totalDiskSpace: { type: Number }, // in GB
      usedDiskSpace: { type: Number, default: 0 }, // in GB
      totalBandwidth: { type: Number }, // in GB
      usedBandwidth: { type: Number, default: 0 }, // in GB
      totalAccounts: { type: Number },
      activeAccounts: { type: Number, default: 0 },
      cpuCores: { type: Number },
      ramGB: { type: Number },
      maxAccounts: { type: Number },
    },
    limits: {
      accountsPerServer: { type: Number, default: 100 },
      diskSpacePerAccount: { type: Number }, // in GB
      bandwidthPerAccount: { type: Number }, // in GB
      maxCPUPercent: { type: Number, default: 80 },
      maxMemoryPercent: { type: Number, default: 80 },
      maxDiskPercent: { type: Number, default: 90 },
    },
    monitoring: {
      enabled: { type: Boolean, default: true },
      lastChecked: Date,
      uptime: { type: Number, default: 100 }, // percentage
      responseTime: { type: Number }, // in ms
      cpuUsage: { type: Number }, // percentage
      memoryUsage: { type: Number }, // percentage
      diskUsage: { type: Number }, // percentage
      loadAverage: {
        oneMinute: Number,
        fiveMinutes: Number,
        fifteenMinutes: Number,
      },
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'offline', 'suspended'],
      default: 'active',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    acceptNewAccounts: {
      type: Boolean,
      default: true,
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
    sshAccess: {
      enabled: { type: Boolean, default: false },
      port: { type: Number, default: 22 },
      username: String,
      privateKey: {
        type: String,
        select: false,
      },
    },
    ssl: {
      enabled: { type: Boolean, default: false },
      certificate: String,
      certificateKey: {
        type: String,
        select: false,
      },
      caBundl: String,
    },
    backup: {
      enabled: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
      },
      retention: Number, // days
      location: String,
      lastBackup: Date,
    },
    maintenance: {
      scheduled: { type: Boolean, default: false },
      startTime: Date,
      endTime: Date,
      reason: String,
    },
    alerts: {
      email: [String],
      webhook: String,
      slack: String,
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
serverSchema.index({ type: 1, status: 1 });
serverSchema.index({ provider: 1, status: 1 });
serverSchema.index({ status: 1, acceptNewAccounts: 1, priority: -1 });
serverSchema.index({ 'monitoring.uptime': 1 });

// Virtuals
serverSchema.virtual('services', {
  ref: 'Service',
  localField: '_id',
  foreignField: 'serverId',
});

serverSchema.virtual('diskUsagePercent').get(function () {
  if (!this.resources.totalDiskSpace || this.resources.totalDiskSpace === 0) return 0;
  return ((this.resources.usedDiskSpace / this.resources.totalDiskSpace) * 100).toFixed(2);
});

serverSchema.virtual('bandwidthUsagePercent').get(function () {
  if (!this.resources.totalBandwidth || this.resources.totalBandwidth === 0) return 0;
  return ((this.resources.usedBandwidth / this.resources.totalBandwidth) * 100).toFixed(2);
});

serverSchema.virtual('accountUsagePercent').get(function () {
  if (!this.resources.totalAccounts || this.resources.totalAccounts === 0) return 0;
  return ((this.resources.activeAccounts / this.resources.totalAccounts) * 100).toFixed(2);
});

serverSchema.virtual('isHealthy').get(function () {
  if (!this.monitoring.enabled) return true;
  
  return (
    this.status === 'active' &&
    this.monitoring.uptime >= 99 &&
    (this.monitoring.cpuUsage || 0) < this.limits.maxCPUPercent &&
    (this.monitoring.memoryUsage || 0) < this.limits.maxMemoryPercent &&
    (this.monitoring.diskUsage || 0) < this.limits.maxDiskPercent
  );
});

serverSchema.virtual('availableSlots').get(function () {
  return this.limits.accountsPerServer - (this.resources.activeAccounts || 0);
});

serverSchema.virtual('isFull').get(function () {
  return this.availableSlots <= 0;
});

// Methods
serverSchema.methods.canAcceptNewAccount = function () {
  return (
    this.isActive &&
    this.acceptNewAccounts &&
    this.status === 'active' &&
    !this.isFull &&
    this.isHealthy
  );
};

serverSchema.methods.incrementAccountCount = async function () {
  this.resources.activeAccounts = (this.resources.activeAccounts || 0) + 1;
  
  if (this.resources.activeAccounts >= this.limits.accountsPerServer) {
    this.acceptNewAccounts = false;
  }
  
  await this.save();
};

serverSchema.methods.decrementAccountCount = async function () {
  if (this.resources.activeAccounts > 0) {
    this.resources.activeAccounts -= 1;
  }
  
  if (this.resources.activeAccounts < this.limits.accountsPerServer) {
    this.acceptNewAccounts = true;
  }
  
  await this.save();
};

serverSchema.methods.updateResourceUsage = async function (resources) {
  this.resources = { ...this.resources, ...resources };
  
  // Check if server is getting full
  const diskPercent = parseFloat(this.diskUsagePercent);
  const accountPercent = parseFloat(this.accountUsagePercent);
  
  if (diskPercent >= this.limits.maxDiskPercent || accountPercent >= 95) {
    this.acceptNewAccounts = false;
  }
  
  await this.save();
};

serverSchema.methods.updateMonitoring = async function (monitoringData) {
  this.monitoring = {
    ...this.monitoring,
    ...monitoringData,
    lastChecked: new Date(),
  };
  
  // Auto-update status based on monitoring
  if (monitoringData.uptime !== undefined && monitoringData.uptime < 50) {
    this.status = 'offline';
  } else if (this.status === 'offline' && monitoringData.uptime >= 50) {
    this.status = 'active';
  }
  
  await this.save();
};

serverSchema.methods.setMaintenance = async function (startTime, endTime, reason) {
  this.maintenance = {
    scheduled: true,
    startTime,
    endTime,
    reason,
  };
  this.status = 'maintenance';
  this.acceptNewAccounts = false;
  await this.save();
};

serverSchema.methods.endMaintenance = async function () {
  this.maintenance = {
    scheduled: false,
    startTime: null,
    endTime: null,
    reason: null,
  };
  this.status = 'active';
  this.acceptNewAccounts = true;
  await this.save();
};

// Static methods
serverSchema.statics.findAvailableServer = async function (type = null, provider = null) {
  const query = {
    isActive: true,
    status: 'active',
    acceptNewAccounts: true,
  };
  
  if (type) query.type = type;
  if (provider) query.provider = provider;
  
  // Find servers with available slots, sorted by priority (highest first) and usage (lowest first)
  const servers = await this.find(query)
    .sort({ priority: -1, 'resources.activeAccounts': 1 })
    .limit(10);
  
  // Return the most suitable server (healthy and with most slots)
  for (const server of servers) {
    if (server.canAcceptNewAccount()) {
      return server;
    }
  }
  
  return null;
};

serverSchema.statics.findServersByProvider = function (provider) {
  return this.find({ provider, isActive: true }).sort({ priority: -1 });
};

serverSchema.statics.findHealthyServers = function () {
  return this.find({
    isActive: true,
    status: 'active',
    'monitoring.uptime': { $gte: 99 },
  }).sort({ priority: -1 });
};

serverSchema.statics.findUnhealthyServers = function () {
  return this.find({
    isActive: true,
    $or: [
      { 'monitoring.uptime': { $lt: 99 } },
      { 'monitoring.cpuUsage': { $gte: 80 } },
      { 'monitoring.memoryUsage': { $gte: 80 } },
      { 'monitoring.diskUsage': { $gte: 90 } },
    ],
  });
};

const Server = mongoose.model('Server', serverSchema);

export default Server;
