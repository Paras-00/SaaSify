import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Auth actions
        'login',
        'logout',
        'register',
        'password_change',
        'password_reset',
        'email_verification',
        '2fa_enabled',
        '2fa_disabled',
        // Profile actions
        'profile_update',
        'wallet_credit_add',
        // Domain actions
        'domain_search',
        'domain_register',
        'domain_renew',
        'domain_transfer',
        'domain_update',
        // Order actions
        'order_create',
        'order_cancel',
        'order_complete',
        // Payment actions
        'payment_success',
        'payment_failed',
        'payment_refund',
        // Admin actions
        'user_suspend',
        'user_activate',
        'user_delete',
        'admin_credit_add',
        // Service actions
        'service_create',
        'service_suspend',
        'service_terminate',
        'service_upgrade',
        // Support actions
        'ticket_create',
        'ticket_reply',
        'ticket_close',
        // System actions
        'api_call',
        'login_failed',
        'security_alert',
      ],
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['auth', 'profile', 'domain', 'order', 'payment', 'admin', 'service', 'support', 'system'],
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      index: true,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'pending', 'warning'],
      default: 'success',
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // For admin actions performed on behalf of other users
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ clientId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ category: 1, createdAt: -1 });
ActivityLogSchema.index({ status: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

// TTL index - automatically delete logs older than 90 days (optional)
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

export default ActivityLog;
