import { EMAIL_TEMPLATE } from '../constants/enums.js';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import handlebars from 'handlebars';
import logger from '../utils/logger.js';
import * as nodemailer from 'nodemailer';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy-load transporter
let transporter = null;

// Create email transporter
const createTransporter = () => {
  if (process.env.EMAIL_PROVIDER === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Default SMTP configuration
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

// Template cache
const templateCache = new Map();

/**
 * Load and compile email template
 * @param {string} templateName - Template name (from EMAIL_TEMPLATE enum)
 * @returns {Promise<Function>} Compiled handlebars template
 */
const loadTemplate = async (templateName) => {
  // Check cache
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  try {
    const templatePath = path.join(
      __dirname,
      '../templates/emails',
      `${templateName}.hbs`
    );

    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiled = handlebars.compile(templateContent);

    // Cache compiled template
    templateCache.set(templateName, compiled);

    return compiled;
  } catch (error) {
    logger.error(`Failed to load email template: ${templateName}`, error);
    throw new Error(`Email template not found: ${templateName}`);
  }
};

/**
 * Get email subject based on template
 * @param {string} templateName - Template name
 * @returns {string} Email subject
 */
const getEmailSubject = (templateName) => {
  const subjects = {
    [EMAIL_TEMPLATE.WELCOME]: 'Welcome to SaaSify!',
    [EMAIL_TEMPLATE.EMAIL_VERIFICATION]: 'Verify Your Email Address',
    [EMAIL_TEMPLATE.PASSWORD_RESET]: 'Reset Your Password',
    [EMAIL_TEMPLATE.PASSWORD_CHANGED]: 'Your Password Has Been Changed',
    [EMAIL_TEMPLATE.TWO_FA_ENABLED]: 'Two-Factor Authentication Enabled',
    [EMAIL_TEMPLATE.TWO_FA_DISABLED]: 'Two-Factor Authentication Disabled',
    [EMAIL_TEMPLATE.INVOICE_CREATED]: 'New Invoice #{{invoiceNumber}}',
    [EMAIL_TEMPLATE.INVOICE_PAID]: 'Payment Received - Invoice #{{invoiceNumber}}',
    [EMAIL_TEMPLATE.INVOICE_OVERDUE]: 'Overdue Invoice #{{invoiceNumber}}',
    [EMAIL_TEMPLATE.SERVICE_ACTIVATED]: 'Service Activated',
    [EMAIL_TEMPLATE.SERVICE_SUSPENDED]: 'Service Suspended',
    [EMAIL_TEMPLATE.SERVICE_TERMINATED]: 'Service Terminated',
    [EMAIL_TEMPLATE.DOMAIN_REGISTERED]: 'Domain Registered Successfully',
    [EMAIL_TEMPLATE.DOMAIN_EXPIRING]: 'Domain Expiring Soon',
    [EMAIL_TEMPLATE.ORDER_CONFIRMATION]: 'Order Confirmation #{{orderNumber}}',
  };

  return subjects[templateName] || 'Notification from SaaSify';
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.template - Template name (from EMAIL_TEMPLATE enum)
 * @param {Object} options.data - Template data
 * @param {string} [options.subject] - Custom subject (overrides default)
 * @param {Array} [options.attachments] - Email attachments
 * @returns {Promise<Object>} Send result
 */
export const sendEmail = async ({ to, template, data = {}, subject, attachments = [] }) => {
  try {
    // Load and compile template
    const compiledTemplate = await loadTemplate(template);

    // Prepare template data with defaults
    const templateData = {
      ...data,
      companyName: process.env.COMPANY_NAME || 'SaaSify',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@saasify.com',
      frontendUrl: process.env.FRONTEND_URL,
      currentYear: new Date().getFullYear(),
    };

    // Render HTML
    const html = compiledTemplate(templateData);

    // Get subject (use custom or default)
    const emailSubject = subject || handlebars.compile(getEmailSubject(template))(data);

    // Email options
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'SaaSify',
        address: process.env.EMAIL_FROM || 'noreply@saasify.com',
      },
      to,
      subject: emailSubject,
      html,
      attachments,
    };

    // Send email
    const info = await getTransporter().sendMail(mailOptions);

    logger.info(`Email sent successfully: ${template} to ${to}`, {
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    logger.error('Failed to send email:', {
      template,
      to,
      error: error.message,
    });

    // Don't throw error to prevent blocking the main flow
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send bulk emails
 * @param {Array} emails - Array of email objects
 * @returns {Promise<Object>} Send results
 */
export const sendBulkEmails = async (emails) => {
  try {
    const results = await Promise.allSettled(
      emails.map((email) => sendEmail(email))
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    logger.info(`Bulk email sent: ${successful} successful, ${failed} failed`);

    return {
      total: results.length,
      successful,
      failed,
      results,
    };
  } catch (error) {
    logger.error('Bulk email send failed:', error);
    throw error;
  }
};

/**
 * Verify email transporter connection
 * @returns {Promise<boolean>}
 */
export const verifyEmailConnection = async () => {
  try {
    await getTransporter().verify();
    logger.info('Email transporter verified successfully');
    return true;
  } catch (error) {
    logger.error('Email transporter verification failed:', error);
    return false;
  }
};

export default {
  sendEmail,
  sendBulkEmails,
  verifyEmailConnection,
};
