import { authenticateToken, requireRole } from '../../middleware/auth.middleware.js';

import express from 'express';
import { validate } from '../../middleware/validation.middleware.js';
import walletController from './wallet.controller.js';
import walletValidation from './wallet.validation.js';

const router = express.Router();

/**
 * Wallet Routes
 * Manage client wallet balance and transactions
 */

// Client wallet routes
router.get(
  '/balance',
  authenticateToken,
  walletController.getWalletBalance
);

router.get(
  '/transactions',
  authenticateToken,
  walletController.getWalletTransactions
);

router.post(
  '/add-funds',
  authenticateToken,
  validate(walletValidation.addFunds, 'body'),
  walletController.addFundsToWallet
);

router.post(
  '/pay-invoice',
  authenticateToken,
  validate(walletValidation.payInvoice, 'body'),
  walletController.payInvoiceFromWallet
);

// Admin wallet management
router.post(
  '/admin/adjust',
  authenticateToken,
  requireRole(['admin']),
  validate(walletValidation.adjustWallet, 'body'),
  walletController.adjustWalletBalance
);

router.get(
  '/admin/transactions',
  authenticateToken,
  requireRole(['admin']),
  walletController.getAllWalletTransactions
);

export default router;
