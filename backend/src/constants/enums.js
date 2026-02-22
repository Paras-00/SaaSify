/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CLIENT: 'client',
};

/**
 * Domain statuses
 */
export const DOMAIN_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  LOCKED: 'locked',
};

/**
 * Service statuses
 */
export const SERVICE_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated',
};

/**
 * Provisioning statuses
 */
export const PROVISIONING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

/**
 * Order statuses
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/**
 * Invoice statuses
 */
export const INVOICE_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded',
  PARTIALLY_PAID: 'partially_paid',
};

/**
 * Transaction types
 */
export const TRANSACTION_TYPE = {
  PAYMENT: 'payment',
  REFUND: 'refund',
};

/**
 * Transaction statuses
 */
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
};

/**
 * Payment gateways
 */
export const PAYMENT_GATEWAY = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
  WALLET: 'wallet',
};

/**
 * Product types
 */
export const PRODUCT_TYPE = {
  DOMAIN: 'domain',
  HOSTING: 'hosting',
  VPS: 'vps',
};

/**
 * Server types
 */
export const SERVER_TYPE = {
  CPANEL: 'cpanel',
  AWS: 'aws',
  DIGITALOCEAN: 'digitalocean',
};

/**
 * Server statuses
 */
export const SERVER_STATUS = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  OVERLOADED: 'overloaded',
};

/**
 * Billing cycles
 */
export const BILLING_CYCLE = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  SEMI_ANNUALLY: 'semiAnnually',
  ANNUALLY: 'annually',
  BIENNIALLY: 'biennially',
  TRIENNIALLY: 'triennially',
};

/**
 * Email templates
 */
export const EMAIL_TEMPLATE = {
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email-verification',
  PASSWORD_RESET: 'password-reset',
  DOMAIN_REGISTERED: 'domain-registered',
  DOMAIN_EXPIRING: 'domain-expiring',
  DOMAIN_RENEWED: 'domain-renewed',
  HOSTING_CREATED: 'hosting-created',
  PROVISIONING_FAILED: 'provisioning-failed',
  INVOICE_GENERATED: 'invoice-generated',
  INVOICE_PAID: 'invoice-paid',
  INVOICE_OVERDUE: 'invoice-overdue',
  PAYMENT_WARNING: 'payment-warning',
  SERVICE_SUSPENDED: 'service-suspended',
  SERVICE_TERMINATED: 'service-terminated',
  SERVICE_EXPIRING: 'service-expiring',
  UPGRADE_COMPLETE: 'upgrade-complete',
  REFUND_PROCESSED: 'refund-processed',
  LOGIN_2FA: 'login-2fa',
};

/**
 * Queue names
 */
export const QUEUE_NAME = {
  DOMAIN: 'domain',
  HOSTING: 'hosting',
  EMAIL: 'email',
  CRON: 'cron-jobs',
};

/**
 * Job names
 */
export const JOB_NAME = {
  REGISTER_DOMAIN: 'register-domain',
  RENEW_DOMAIN: 'renew-domain',
  CREATE_HOSTING: 'create-hosting',
  SUSPEND_HOSTING: 'suspend-hosting',
  UNSUSPEND_HOSTING: 'unsuspend-hosting',
  TERMINATE_HOSTING: 'terminate-hosting',
  UPGRADE_HOSTING: 'upgrade-hosting',
  BACKUP_HOSTING: 'backup-hosting',
  SEND_EMAIL: 'send-email',
  GENERATE_INVOICES: 'generate-invoices',
  CHECK_SUSPENSIONS: 'check-suspensions',
  CHECK_DOMAIN_EXPIRY: 'check-domain-expiry',
};
