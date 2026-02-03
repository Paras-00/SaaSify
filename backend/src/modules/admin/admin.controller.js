import { errorResponse, successResponse } from '../../utils/response.js';

import ActivityLog from '../../models/ActivityLog.js';
import Client from '../../models/Client.js';
import Order from '../../models/Order.js';
import Transaction from '../../models/Transaction.js';
import User from '../../models/User.js';
import logger from '../../utils/logger.js';

/**
 * Get all users with filters and pagination
 * GET /api/admin/users
 */
export const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      isEmailVerified,
      twoFAEnabled,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Apply filters
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'clientData.firstName': { $regex: search, $options: 'i' } },
        { 'clientData.lastName': { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;
    if (isEmailVerified !== undefined) query.isEmailVerified = isEmailVerified === 'true';
    if (twoFAEnabled !== undefined) query.twoFAEnabled = twoFAEnabled === 'true';

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'clients',
            localField: '_id',
            foreignField: 'userId',
            as: 'clientData',
          },
        },
        { $unwind: { path: '$clientData', preserveNullAndEmptyArrays: true } },
        { $sort: sort },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $project: {
            password: 0,
            twoFASecret: 0,
            resetPasswordToken: 0,
            emailVerificationToken: 0,
            'clientData.userId': 0,
            'clientData.__v': 0,
          },
        },
      ]),
      User.countDocuments(query),
    ]);

    return successResponse(res, 'Users retrieved successfully', {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get users error:', error);
    return errorResponse(res, 'Failed to retrieve users', 500);
  }
};

/**
 * Get user details by ID
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -twoFASecret -resetPasswordToken -emailVerificationToken')
      .lean();

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const client = await Client.findOne({ userId: id }).lean();

    // Get user statistics
    const [orderCount, totalSpent, activityCount] = await Promise.all([
      Order.countDocuments({ userId: id }),
      Transaction.aggregate([
        { $match: { userId: user._id, type: 'debit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      ActivityLog.countDocuments({ userId: id }),
    ]);

    return successResponse(res, 'User details retrieved successfully', {
      user: {
        ...user,
        client,
        stats: {
          orders: orderCount,
          totalSpent: totalSpent[0]?.total || 0,
          activities: activityCount,
        },
      },
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    return errorResponse(res, 'Failed to retrieve user details', 500);
  }
};

/**
 * Update user by ID
 * PATCH /api/admin/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const adminUserId = req.user.userId;

    const user = await User.findById(id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Prevent admin from modifying their own role
    if (user._id.toString() === adminUserId && updates.role) {
      return errorResponse(res, 'You cannot modify your own role', 403);
    }

    // Update user fields
    const userFields = ['email', 'role', 'status', 'isEmailVerified'];
    userFields.forEach((field) => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    // Update client profile if provided
    if (updates.firstName || updates.lastName || updates.company || updates.phone) {
      await Client.findOneAndUpdate(
        { userId: id },
        {
          $set: {
            ...(updates.firstName && { firstName: updates.firstName }),
            ...(updates.lastName && { lastName: updates.lastName }),
            ...(updates.company && { company: updates.company }),
            ...(updates.phone && { phone: updates.phone }),
          },
        }
      );
    }

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: 'profile_update',
      category: 'admin',
      description: `User profile updated by admin`,
      metadata: { updatedFields: Object.keys(updates), updatedBy: adminUserId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
      performedBy: adminUserId,
    });

    return successResponse(res, 'User updated successfully', { user });
  } catch (error) {
    logger.error('Update user error:', error);
    return errorResponse(res, 'Failed to update user', 500);
  }
};

/**
 * Delete user by ID
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.userId;

    const user = await User.findById(id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === adminUserId) {
      return errorResponse(res, 'You cannot delete your own account', 403);
    }

    // Soft delete - mark as deleted
    user.status = 'deleted';
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: 'user_delete',
      category: 'admin',
      description: `User account deleted by admin`,
      metadata: { deletedBy: adminUserId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
      performedBy: adminUserId,
    });

    return successResponse(res, 'User deleted successfully');
  } catch (error) {
    logger.error('Delete user error:', error);
    return errorResponse(res, 'Failed to delete user', 500);
  }
};

/**
 * Suspend user
 * POST /api/admin/users/:id/suspend
 */
export const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, duration, permanent } = req.body;
    const adminUserId = req.user.userId;

    const user = await User.findById(id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Prevent admin from suspending themselves
    if (user._id.toString() === adminUserId) {
      return errorResponse(res, 'You cannot suspend your own account', 403);
    }

    // Prevent suspending other admins
    if (user.role === 'admin') {
      return errorResponse(res, 'You cannot suspend admin accounts', 403);
    }

    user.status = 'suspended';
    await user.save();

    const suspensionData = {
      reason,
      permanent: permanent || false,
      suspendedAt: new Date(),
      suspendedBy: adminUserId,
    };

    if (duration && !permanent) {
      suspensionData.suspendedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    }

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: 'user_suspend',
      category: 'admin',
      description: `User account suspended: ${reason}`,
      metadata: suspensionData,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
      performedBy: adminUserId,
    });

    return successResponse(res, 'User suspended successfully', {
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
        suspension: suspensionData,
      },
    });
  } catch (error) {
    logger.error('Suspend user error:', error);
    return errorResponse(res, 'Failed to suspend user', 500);
  }
};

/**
 * Add wallet credit to client
 * POST /api/admin/clients/:id/credit
 */
export const addClientCredit = async (req, res) => {
  try {
    const { id } = req.params; // client ID
    const { amount, reason, type } = req.body;
    const adminUserId = req.user.userId;

    const client = await Client.findById(id);

    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    // Create transaction record
    const transaction = await Transaction.create({
      userId: client.userId,
      clientId: client._id,
      type: 'credit',
      amount,
      currency: client.walletCurrency,
      description: `Admin credit: ${reason}`,
      status: 'completed',
      paymentMethod: 'admin',
      metadata: {
        adminId: adminUserId,
        creditType: type,
        reason,
      },
    });

    // Update wallet balance
    client.walletBalance += amount;
    await client.save();

    // Log activity
    await ActivityLog.create({
      userId: client.userId,
      clientId: client._id,
      action: 'admin_credit_add',
      category: 'admin',
      description: `Admin added ${amount} ${client.walletCurrency} credit: ${reason}`,
      metadata: {
        amount,
        type,
        reason,
        transactionId: transaction._id,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
      performedBy: adminUserId,
    });

    return successResponse(res, 'Credit added successfully', {
      client: {
        id: client._id,
        walletBalance: client.walletBalance,
        currency: client.walletCurrency,
      },
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
      },
    });
  } catch (error) {
    logger.error('Add client credit error:', error);
    return errorResponse(res, 'Failed to add credit', 500);
  }
};

/**
 * Get audit logs
 * GET /api/admin/audit-logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      category,
      status,
      startDate,
      endDate,
      performedBy,
    } = req.query;

    const query = {};

    // Apply filters
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (category) query.category = category;
    if (status) query.status = status;
    if (performedBy) query.performedBy = performedBy;

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
        .populate('userId', 'email role')
        .populate('performedBy', 'email role')
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    return successResponse(res, 'Audit logs retrieved successfully', {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    return errorResponse(res, 'Failed to retrieve audit logs', 500);
  }
};

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;

    // Calculate date range based on period
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'today':
        dateFilter = {
          $gte: new Date(now.setHours(0, 0, 0, 0)),
          $lte: new Date(now.setHours(23, 59, 59, 999)),
        };
        break;
      case 'week':
        dateFilter = {
          $gte: new Date(now.setDate(now.getDate() - 7)),
          $lte: new Date(),
        };
        break;
      case 'month':
        dateFilter = {
          $gte: new Date(now.setMonth(now.getMonth() - 1)),
          $lte: new Date(),
        };
        break;
      case 'year':
        dateFilter = {
          $gte: new Date(now.setFullYear(now.getFullYear() - 1)),
          $lte: new Date(),
        };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          };
        }
        break;
    }

    // Get statistics
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      pendingRevenue,
      recentUsers,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'completed' }),
      Transaction.aggregate([
        { $match: { type: 'debit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'debit', status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('email role status createdAt isEmailVerified')
        .lean(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'email')
        .select('orderNumber totalAmount status createdAt')
        .lean(),
    ]);

    // Revenue by period
    const revenueByPeriod = await Transaction.aggregate([
      {
        $match: {
          type: 'debit',
          status: 'completed',
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    return successResponse(res, 'Dashboard statistics retrieved successfully', {
      overview: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          pending: pendingRevenue[0]?.total || 0,
        },
      },
      recentActivity: {
        users: recentUsers,
        orders: recentOrders,
      },
      charts: {
        revenue: revenueByPeriod,
      },
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    return errorResponse(res, 'Failed to retrieve dashboard statistics', 500);
  }
};
