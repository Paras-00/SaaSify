import {
  activityLogQuerySchema,
  addWalletCreditSchema,
  updateProfileSchema,
} from './client.validation.js';
import {
  addWalletCredit,
  getActivityLogs,
  getProfile,
  getWallet,
  updateProfile,
} from './client.controller.js';

import { authenticateToken } from '../../models/middleware/auth.middleware.js';
import express from 'express';
import { validate } from '../../models/middleware/validation.middleware.js';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authenticateToken);

/**
 * @route   GET /api/clients/me
 * @desc    Get client profile
 * @access  Private (Client)
 */
router.get('/me', getProfile);

/**
 * @route   PATCH /api/clients/me
 * @desc    Update client profile
 * @access  Private (Client)
 */
router.patch('/me', validate(updateProfileSchema), updateProfile);

/**
 * @route   GET /api/clients/me/wallet
 * @desc    Get wallet balance and recent transactions
 * @access  Private (Client)
 */
router.get('/me/wallet', getWallet);

/**
 * @route   POST /api/clients/me/wallet/add
 * @desc    Add funds to wallet
 * @access  Private (Client)
 */
router.post('/me/wallet/add', validate(addWalletCreditSchema), addWalletCredit);

/**
 * @route   GET /api/clients/me/activity
 * @desc    Get activity logs
 * @access  Private (Client)
 */
router.get('/me/activity', validate(activityLogQuerySchema, 'query'), getActivityLogs);

export default router;
