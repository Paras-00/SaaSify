import {
  addToCart,
  applyCoupon,
  checkout,
  clearCart,
  getCart,
  removeCoupon,
  removeFromCart,
  updateCartItem,
} from './cart.controller.js';
import {
  addToCartSchema,
  applyCouponSchema,
  checkoutSchema,
  updateCartItemSchema,
} from './cart.validation.js';

import { authenticateToken } from '../../middleware/auth.middleware.js';
import express from 'express';
import { validate } from '../../middleware/validation.middleware.js';

const router = express.Router();

/**
 * All cart routes require authentication
 */
router.use(authenticateToken);

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get('/', getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/add', validate(addToCartSchema), addToCart);

/**
 * @route   PATCH /api/cart/:itemId
 * @desc    Update cart item
 * @access  Private
 */
router.patch('/:itemId', validate(updateCartItemSchema), updateCartItem);

/**
 * @route   DELETE /api/cart/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/:itemId', removeFromCart);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/clear', clearCart);

/**
 * @route   POST /api/cart/coupon
 * @desc    Apply coupon code
 * @access  Private
 */
router.post('/coupon', validate(applyCouponSchema), applyCoupon);

/**
 * @route   DELETE /api/cart/coupon
 * @desc    Remove applied coupon
 * @access  Private
 */
router.delete('/coupon', removeCoupon);

/**
 * @route   POST /api/cart/checkout
 * @desc    Checkout and create order
 * @access  Private
 */
router.post('/checkout', validate(checkoutSchema), checkout);

export default router;
