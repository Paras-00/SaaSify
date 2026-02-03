import * as authController from './auth.controller.js';
import * as authValidation from './auth.validation.js';

import { authLimiterMiddleware as authLimiter } from '../../models/middleware/rateLimit.middleware.js';
import { authenticateToken } from '../../models/middleware/auth.middleware.js';
import express from 'express';
import { validate } from '../../models/middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  validate(authValidation.registerSchema),
  authController.register
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post(
  '/verify-email',
  validate(authValidation.verifyEmailSchema),
  authController.verifyEmail
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validate(authValidation.loginSchema),
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh-token',
  validate(authValidation.refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate(authValidation.forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(authValidation.resetPasswordSchema),
  authController.resetPassword
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post(
  '/change-password',
  authenticateToken,
  validate(authValidation.changePasswordSchema),
  authController.changePassword
);

/**
 * @route   POST /api/auth/enable-2fa
 * @desc    Enable two-factor authentication
 * @access  Private
 */
router.post('/enable-2fa', authenticateToken, authController.enable2FA);

/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify and activate 2FA
 * @access  Private
 */
router.post(
  '/verify-2fa',
  authenticateToken,
  validate(authValidation.verify2FASchema),
  authController.verify2FA
);

/**
 * @route   POST /api/auth/disable-2fa
 * @desc    Disable two-factor authentication
 * @access  Private
 */
router.post(
  '/disable-2fa',
  authenticateToken,
  validate(authValidation.verify2FASchema),
  authController.disable2FA
);

export default router;
