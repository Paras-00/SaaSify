import { errorResponse, successResponse } from '../../utils/response.js';

import ActivityLog from '../../models/ActivityLog.js';
import Client from '../../models/Client.js';
import Transaction from '../../models/Transaction.js';
import User from '../../models/User.js';
import logger from '../../utils/logger.js';

/**
 * Get client profile (authenticated user)
 * GET /api/clients/me
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const client = await Client.findOne({ userId })
      .populate('userId', 'email role isEmailVerified twoFAEnabled status')
      .lean();    /** Don’t give me a full Mongoose document. Just give me a plain JavaScript object.**/

    if (!client) {
      return errorResponse(res, 'Client profile not found', 404);
    }

    // Log activity
    await ActivityLog.create({
      userId,
      clientId: client._id,
      action: 'profile_update',
      category: 'profile',
      description: 'Viewed profile',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    return successResponse(res, 'Profile retrieved successfully', {
      client: {
        ...client,
        user: client.userId,
        userId: undefined,
      },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    return errorResponse(res, 'Failed to retrieve profile', 500);
  }
};

/**
 * Update client profile
 * PATCH /api/clients/me
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    const client = await Client.findOne({ userId });

    if (!client) {
      return errorResponse(res, 'Client profile not found', 404);
    }

    // Update allowed fields
    const allowedFields = [
      'firstName',
      'lastName',
      'company',
      'phone',
      'address',
      'billingAddress',
      'taxId',
      'currency',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        client[field] = updates[field];
      }
    });

    await client.save();

    // Log activity
    await ActivityLog.create({
      userId,
      clientId: client._id,
      action: 'profile_update',
      category: 'profile',
      description: 'Updated profile information',
      metadata: { updatedFields: Object.keys(updates) },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    return successResponse(res, 'Profile updated successfully', {
      client,
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    return errorResponse(res, 'Failed to update profile', 500);
  }
};

/**
 * Get wallet balance
 * GET /api/clients/me/wallet
 */
export const getWallet = async (req, res) => {
  try {
    const userId = req.user.userId;

    const client = await Client.findOne({ userId })
      .select('walletBalance walletCurrency')
      .lean();

    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    // Get recent transactions
    const recentTransactions = await Transaction.find({
      userId,
      type: { $in: ['credit', 'debit'] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type amount currency description status createdAt')
      .lean();

    return successResponse(res, 'Wallet retrieved successfully', {
      wallet: {
        balance: client.walletBalance,
        currency: client.walletCurrency,
      },
      recentTransactions,
    });
  } catch (error) {
    logger.error('Get wallet error:', error);
    return errorResponse(res, 'Failed to retrieve wallet', 500);
  }
};

/**
 * Add funds to wallet
 * POST /api/clients/me/wallet/add
 */
export const addWalletCredit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, paymentMethod, paymentDetails } = req.body;

    const client = await Client.findOne({ userId });

    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    // In production, integrate with payment gateway here
    // For now, we'll simulate a successful payment

    // Create transaction record
    const transaction = await Transaction.create({
      userId,
      clientId: client._id,
      type: 'credit',
      amount,
      currency: client.walletCurrency,
      description: `Wallet credit added via ${paymentMethod}`,
      status: 'completed',
      paymentMethod,
      metadata: {
        paymentDetails,
        transactionType: 'wallet_credit',
      },
    });

    // Update wallet balance
    client.walletBalance += amount;
    await client.save();

    // Log activity
    await ActivityLog.create({
      userId,
      clientId: client._id,
      action: 'wallet_credit_add',
      category: 'payment',
      description: `Added ${amount} ${client.walletCurrency} to wallet`,
      metadata: {
        amount,
        paymentMethod,
        transactionId: transaction._id,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    return successResponse(res, 'Wallet credited successfully', {
      wallet: {
        balance: client.walletBalance,
        currency: client.walletCurrency,
      },
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    logger.error('Add wallet credit error:', error);
    return errorResponse(res, 'Failed to add wallet credit', 500);
  }
};

/**
 * Get activity logs
 * GET /api/clients/me/activity
 */
export const getActivityLogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 20,
      action,
      category,
      status,
      startDate,
      endDate,
    } = req.query;

    const query = { userId };

    // Apply filters
    if (action) query.action = action;
    if (category) query.category = category;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-userAgent -__v')
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    return successResponse(res, 'Activity logs retrieved successfully', {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get activity logs error:', error);
    return errorResponse(res, 'Failed to retrieve activity logs', 500);
  }
};
