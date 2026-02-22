import { errorResponse, successResponse } from '../../utils/response.js';
import { generateToken, hashPassword, verifyPassword } from '../../utils/encryption.js';

import Client from '../../models/Client.js';
import { EMAIL_TEMPLATE } from '../../constants/enums.js';
import QRCode from 'qrcode';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import logger from '../../utils/logger.js';
import { sendEmail } from '../../services/email.service.js';
import speakeasy from 'speakeasy';

// Token blacklist (in production, use Redis)
const tokenBlacklist = new Set();

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, company, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = generateToken(32);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      emailVerificationToken,
      role: 'client',
    });

    // console.log(`Verification link is : ${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`)

    // Create client profile
    const client = await Client.create({
      userId: user._id,
      firstName,
      lastName,
      company,
      phone,
      email,
    });

    // Send verification email
    await sendEmail({
      to: email,
      template: EMAIL_TEMPLATE.EMAIL_VERIFICATION,
      data: {
        firstName,
        verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`,
      },

    });

    // Generate accessToken for immediate login to setup 2FA
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );


    logger.info(`New user registered: ${email}`);

    return successResponse(res, {
      accessToken, // Return token for immediate 2FA setup
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      client: {
        id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        fullName: client.fullName,
      },
    }, 'Registration successful. Please check your email to verify your account.', 201);
  } catch (error) {
    logger.error('Registration error:', error);
    return errorResponse(res, 'Registration failed', 500);
  }
};

/**
 * Verify email
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return errorResponse(res, 'Invalid or expired verification token', 400);
    }

    if (user.emailVerified) {
      return errorResponse(res, 'Email already verified', 400);
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Set HTTP-only cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Get client info
    const client = await Client.findOne({ userId: user._id });

    // Send welcome email
    await sendEmail({
      to: user.email,
      template: EMAIL_TEMPLATE.WELCOME,
      data: {
        firstName: client?.firstName || 'User',
      },
    });

    logger.info(`Email verified: ${user.email}`);

    return successResponse(res, {
      message: 'Email verified successfully. You can now login.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      client: client ? {
        id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        fullName: client.fullName,
      } : null,
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    return errorResponse(res, 'Email verification failed', 500);
  }
};

/**
 * Login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password, twoFACode } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return errorResponse(
        res,
        `Account is locked. Please try again in ${lockTimeRemaining} minutes.`,
        423
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts += 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await user.save();
        logger.warn(`Account locked due to failed login attempts: ${email}`);
        return errorResponse(
          res,
          'Too many failed login attempts. Account locked for 30 minutes.',
          423
        );
      }

      await user.save();
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Check email verification
    if (!user.emailVerified) {
      return errorResponse(res, 'Please verify your email before logging in', 403);
    }

    // Two-Step Verification (Email Code)
    // Generate 6-digit random code
    const login2FACode = Math.floor(100000 + Math.random() * 900000).toString();
    const login2FAExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.login2FACode = login2FACode;
    user.login2FAExpires = login2FAExpires;
    await user.save();

    // Get client info for personalization
    const client = await Client.findOne({ userId: user._id });

    // Send 2FA email
    await sendEmail({
      to: user.email,
      template: EMAIL_TEMPLATE.LOGIN_2FA,
      data: {
        firstName: client?.firstName || 'User',
        code: login2FACode,
      },
    });

    logger.info(`Login 2FA code sent to: ${email}`);

    return successResponse(res, {
      require2FA: true,
      email: user.email,
      message: 'A verification code has been sent to your email.',
    });
  } catch (error) {
    logger.error('Login error:', error);
    return errorResponse(res, 'Login failed', 500);
  }
};

/**
 * Verify Login 2FA
 * POST /api/auth/verify-login-2fa
 */
export const verifyLogin2FA = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return errorResponse(res, 'Email and verification code are required', 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(res, 'Invalid credentials', 400);
    }

    // Check if code matches and is not expired
    if (!user.login2FACode || user.login2FACode !== code) {
      return errorResponse(res, 'Invalid verification code', 400);
    }

    if (new Date() > user.login2FAExpires) {
      return errorResponse(res, 'Verification code has expired', 400);
    }

    // Reset 2FA code
    user.login2FACode = undefined;
    user.login2FAExpires = undefined;

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Get client info
    const client = await Client.findOne({ userId: user._id });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Set HTTP-only cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(`User logged in via 2FA: ${email}`);

    return successResponse(res, {
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        twoFAEnabled: user.twoFAEnabled,
      },
      client: client ? {
        id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        fullName: client.fullName,
        company: client.company,
        walletBalance: client.walletBalance,
      } : null,
    });
  } catch (error) {
    logger.error('2FA verification error:', error);
    return errorResponse(res, 'Verification failed', 500);
  }
};

/**
 * Logout
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    if (token) {
      // Add token to blacklist (in production, use Redis with TTL)
      tokenBlacklist.add(token);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    logger.info(`User logged out: ${req.user?.email}`);

    return successResponse(res, {
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    return errorResponse(res, 'Logout failed', 500);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body || {};
    const cookieToken = req.cookies.refreshToken;

    const refreshTokenToUse = token || cookieToken;

    if (!refreshTokenToUse) {
      return errorResponse(res, 'Refresh token required', 401);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshTokenToUse, process.env.JWT_REFRESH_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    // Set new access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return successResponse(res, {
      message: 'Token refreshed successfully',
      accessToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Refresh token expired. Please login again.', 401);
    }

    logger.error('Token refresh error:', error);
    return errorResponse(res, 'Token refresh failed', 401);
  }
};

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return successResponse(res, {
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = generateToken(32);
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpires;
    await user.save();

    // Get client info
    const client = await Client.findOne({ userId: user._id });

    // Send password reset email
    await sendEmail({
      to: email,
      template: EMAIL_TEMPLATE.PASSWORD_RESET,
      data: {
        firstName: client?.firstName || 'User',
        resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
        expiresIn: '1 hour',
      },
    });

    logger.info(`Password reset requested: ${email}`);

    return successResponse(res, {
      message: 'If the email exists, a password reset link has been sent.',
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    return errorResponse(res, 'Failed to process password reset request', 500);
  }
};

/**
 * Reset password
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, 'Invalid or expired reset token', 400);
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    user.passwordHash = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Get client info
    const client = await Client.findOne({ userId: user._id });

    // Send password changed notification
    await sendEmail({
      to: user.email,
      template: EMAIL_TEMPLATE.PASSWORD_CHANGED,
      data: {
        firstName: client?.firstName || 'User',
      },
    });

    logger.info(`Password reset successful: ${user.email}`);

    return successResponse(res, {
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    logger.error('Password reset error:', error);
    return errorResponse(res, 'Password reset failed', 500);
  }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return errorResponse(res, 'Current password is incorrect', 401);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    user.passwordHash = passwordHash;
    await user.save();

    // Get client info
    const client = await Client.findOne({ userId: user._id });

    // Send password changed notification
    await sendEmail({
      to: user.email,
      template: EMAIL_TEMPLATE.PASSWORD_CHANGED,
      data: {
        firstName: client?.firstName || 'User',
      },
    });

    logger.info(`Password changed: ${user.email}`);

    return successResponse(res, {
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    return errorResponse(res, 'Password change failed', 500);
  }
};

/**
 * Enable 2FA
 * POST /api/auth/enable-2fa
 */
export const enable2FA = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.twoFAEnabled) {
      return errorResponse(res, '2FA is already enabled', 400);
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `SaaSify (${user.email})`,
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret (temporarily until verified)
    user.twoFASecret = secret.base32;
    await user.save();

    logger.info(`2FA setup initiated: ${user.email}`);

    return successResponse(res, {
      message: '2FA setup initiated. Scan the QR code with your authenticator app.',
      secret: secret.base32,
      qrCode,
    });
  } catch (error) {
    logger.error('Enable 2FA error:', error);
    return errorResponse(res, 'Failed to enable 2FA', 500);
  }
};

/**
 * Verify and activate 2FA
 * POST /api/auth/verify-2fa
 */
export const verify2FA = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.twoFAEnabled) {
      return errorResponse(res, '2FA is already enabled', 400);
    }

    if (!user.twoFASecret) {
      return errorResponse(res, 'Please initiate 2FA setup first', 400);
    }

    // Verify code
    const isValid = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      return errorResponse(res, 'Invalid 2FA code', 401);
    }

    // Enable 2FA
    user.twoFAEnabled = true;
    await user.save();

    // Get client info
    const client = await Client.findOne({ userId: user._id });

    // Send 2FA enabled notification
    await sendEmail({
      to: user.email,
      template: EMAIL_TEMPLATE.TWO_FA_ENABLED,
      data: {
        firstName: client?.firstName || 'User',
      },
    });

    logger.info(`2FA enabled: ${user.email}`);

    return successResponse(res, {
      message: '2FA enabled successfully',
    });
  } catch (error) {
    logger.error('Verify 2FA error:', error);
    return errorResponse(res, 'Failed to verify 2FA', 500);
  }
};

/**
 * Disable 2FA
 * POST /api/auth/disable-2fa
 */
export const disable2FA = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (!user.twoFAEnabled) {
      return errorResponse(res, '2FA is not enabled', 400);
    }

    // Verify code before disabling
    const isValid = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      return errorResponse(res, 'Invalid 2FA code', 401);
    }

    // Disable 2FA
    user.twoFAEnabled = false;
    user.twoFASecret = undefined;
    await user.save();

    // Get client info
    const client = await Client.findOne({ userId: user._id });

    // Send 2FA disabled notification
    await sendEmail({
      to: user.email,
      template: EMAIL_TEMPLATE.TWO_FA_DISABLED,
      data: {
        firstName: client?.firstName || 'User',
      },
    });

    logger.info(`2FA disabled: ${user.email}`);

    return successResponse(res, {
      message: '2FA disabled successfully',
    });
  } catch (error) {
    logger.error('Disable 2FA error:', error);
    return errorResponse(res, 'Failed to disable 2FA', 500);
  }
};

// Export token blacklist check (for middleware)
export const isTokenBlacklisted = (token) => tokenBlacklist.has(token);
