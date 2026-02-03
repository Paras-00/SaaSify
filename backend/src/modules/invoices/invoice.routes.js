import { authenticateToken, requireRole } from '../../middleware/auth.middleware.js';

import express from 'express';
import invoiceController from './invoice.controller.js';
import invoiceValidation from './invoice.validation.js';
import { validate } from '../../middleware/validation.middleware.js';

const router = express.Router();

/**
 * Invoice Routes
 * All routes require authentication
 */

// Client routes - view own invoices
router.get(
  '/',
  authenticateToken,
  invoiceController.getMyInvoices
);

router.get(
  '/:id',
  authenticateToken,
  invoiceController.getInvoiceById
);

router.get(
  '/:id/pdf',
  authenticateToken,
  invoiceController.downloadInvoicePDF
);

router.post(
  '/:id/pay',
  authenticateToken,
  validate(invoiceValidation.payInvoice, 'body'),
  invoiceController.payInvoice
);

// Admin routes - manage all invoices
router.post(
  '/admin/create',
  authenticateToken,
  requireRole(['admin']),
  validate(invoiceValidation.createInvoice, 'body'),
  invoiceController.createInvoice
);

router.get(
  '/admin/all',
  authenticateToken,
  requireRole(['admin']),
  invoiceController.getAllInvoices
);

router.patch(
  '/admin/:id',
  authenticateToken,
  requireRole(['admin']),
  validate(invoiceValidation.updateInvoice, 'body'),
  invoiceController.updateInvoice
);

router.delete(
  '/admin/:id',
  authenticateToken,
  requireRole(['admin']),
  invoiceController.deleteInvoice
);

router.post(
  '/admin/:id/send-email',
  authenticateToken,
  requireRole(['admin']),
  invoiceController.sendInvoiceEmail
);

export default router;
