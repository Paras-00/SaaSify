import {
  addClientCredit,
  deleteUser,
  getAuditLogs,
  getDashboardStats,
  getUserById,
  getUsers,
  suspendUser,
  updateUser,
} from './admin.controller.js';
import {
  adminAddCreditSchema,
  auditLogsQuerySchema,
  getUsersQuerySchema,
  statsQuerySchema,
  suspendUserSchema,
  updateUserSchema,
} from './admin.validation.js';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware.js';

import express from 'express';
import { validate } from '../../middleware/validation.middleware.js';

const router = express.Router();

/**
 * All routes require authentication and admin role
 */
router.use(authenticateToken);
router.use(requireRole('admin'));

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters and pagination
 * @access  Private (Admin)
 */
router.get('/users', validate(getUsersQuerySchema, 'query'), getUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details by ID
 * @access  Private (Admin)
 */
router.get('/users/:id', getUserById);

/**
 * @route   PATCH /api/admin/users/:id
 * @desc    Update user by ID
 * @access  Private (Admin)
 */
router.patch('/users/:id', validate(updateUserSchema), updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user by ID (soft delete)
 * @access  Private (Admin)
 */
router.delete('/users/:id', deleteUser);

/**
 * @route   POST /api/admin/users/:id/suspend
 * @desc    Suspend user account
 * @access  Private (Admin)
 */
router.post('/users/:id/suspend', validate(suspendUserSchema), suspendUser);

/**
 * @route   POST /api/admin/clients/:id/credit
 * @desc    Add wallet credit to client
 * @access  Private (Admin)
 */
router.post('/clients/:id/credit', validate(adminAddCreditSchema), addClientCredit);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs with filters
 * @access  Private (Admin)
 */
router.get('/audit-logs', validate(auditLogsQuerySchema, 'query'), getAuditLogs);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get('/stats', validate(statsQuerySchema, 'query'), getDashboardStats);

export default router;
