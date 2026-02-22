import { errorResponse, successResponse } from '../../utils/response.js';

import ActivityLog from '../../models/ActivityLog.js';
import Client from '../../models/Client.js';
import Domain from '../../models/Domain.js';
import Invoice from '../../models/Invoice.js';
import Order from '../../models/Order.js';
import Transaction from '../../models/Transaction.js';
import User from '../../models/User.js';
import { domainRegistrationQueue } from '../../queues/domain.queue.js';
import godaddyService from '../../services/godaddy.service.js';
import invoiceService from '../../services/invoice.service.js';
import logger from '../../utils/logger.js';
import mongoose from 'mongoose';
import razorpayService from '../../services/razorpay.service.js';

// In-memory cart storage (in production, use Redis or database)
const cartStorage = new Map();

/**
 * Get cart key for user
 */
const getCartKey = (userId) => `cart:${userId}`;

/**
 * Get user's cart
 * GET /api/cart
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartKey = getCartKey(userId);

    const cart = cartStorage.get(cartKey) || {
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      currency: 'USD',
      coupon: null,
    };

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity * item.period, 0);
    cart.total = cart.subtotal - cart.discount + cart.tax;

    return successResponse(res, { cart }, 'Cart retrieved successfully');
  } catch (error) {
    logger.error('Get cart error:', error);
    return errorResponse(res, 'Failed to retrieve cart', 500);
  }
};

/**
 * Add item to cart
 * POST /api/cart/add
 */
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, itemId, name, price, period, quantity, currency, metadata } = req.body;

    const cartKey = getCartKey(userId);
    const cart = cartStorage.get(cartKey) || {
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      currency: currency || 'USD',
      coupon: null,
    };

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      (item) => item.itemId === itemId && item.type === type
    );

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity || 1;
      cart.items[existingItemIndex].period = period || cart.items[existingItemIndex].period;
    } else {
      // Add new item
      cart.items.push({
        id: new mongoose.Types.ObjectId().toString(),
        type,
        itemId,
        name,
        price,
        period: period || 1,
        quantity: quantity || 1,
        currency: currency || 'USD',
        metadata: metadata || {},
        addedAt: new Date(),
      });
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity * item.period, 0);
    cart.total = cart.subtotal - cart.discount + cart.tax;

    cartStorage.set(cartKey, cart);

    // Log activity
    await ActivityLog.create({
      userId,
      action: 'order_create',
      category: 'order',
      description: `Added ${name} to cart`,
      metadata: {
        type,
        itemId,
        price,
        cartTotal: cart.total,
        itemsCount: cart.items.length,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    return successResponse(res, { cart }, 'Item added to cart');
  } catch (error) {
    logger.error('Add to cart error:', error);
    return errorResponse(res, 'Failed to add item to cart', 500);
  }
};

/**
 * Update cart item
 * PATCH /api/cart/:itemId
 */
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;
    const updates = req.body;

    const cartKey = getCartKey(userId);
    const cart = cartStorage.get(cartKey);

    if (!cart) {
      return errorResponse(res, 'Cart is empty', 404);
    }

    const itemIndex = cart.items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      return errorResponse(res, 'Item not found in cart', 404);
    }

    // Update item
    if (updates.quantity !== undefined) {
      cart.items[itemIndex].quantity = updates.quantity;
    }
    if (updates.period !== undefined) {
      cart.items[itemIndex].period = updates.period;
    }
    if (updates.metadata !== undefined) {
      cart.items[itemIndex].metadata = {
        ...cart.items[itemIndex].metadata,
        ...updates.metadata,
      };
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity * item.period, 0);
    cart.total = cart.subtotal - cart.discount + cart.tax;

    cartStorage.set(cartKey, cart);

    return successResponse(res, { cart }, 'Cart item updated');
  } catch (error) {
    logger.error('Update cart item error:', error);
    return errorResponse(res, 'Failed to update cart item', 500);
  }
};

/**
 * Remove item from cart
 * DELETE /api/cart/:itemId
 */
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;

    const cartKey = getCartKey(userId);
    const cart = cartStorage.get(cartKey);

    if (!cart) {
      return errorResponse(res, 'Cart is empty', 404);
    }

    const itemIndex = cart.items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      return errorResponse(res, 'Item not found in cart', 404);
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity * item.period, 0);
    cart.total = cart.subtotal - cart.discount + cart.tax;

    cartStorage.set(cartKey, cart);

    return successResponse(res, { cart }, 'Item removed from cart');
  } catch (error) {
    logger.error('Remove from cart error:', error);
    return errorResponse(res, 'Failed to remove item from cart', 500);
  }
};

/**
 * Clear cart
 * DELETE /api/cart/clear
 */
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartKey = getCartKey(userId);

    cartStorage.delete(cartKey);

    return successResponse(res, {}, 'Cart cleared successfully');
  } catch (error) {
    logger.error('Clear cart error:', error);
    return errorResponse(res, 'Failed to clear cart', 500);
  }
};

/**
 * Apply coupon code
 * POST /api/cart/coupon
 */
export const applyCoupon = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { code } = req.body;

    const cartKey = getCartKey(userId);
    const cart = cartStorage.get(cartKey);

    if (!cart || cart.items.length === 0) {
      return errorResponse(res, 'Cart is empty', 400);
    }

    // Validate coupon (simplified - in production, check database)
    const validCoupons = {
      'WELCOME10': { type: 'percentage', value: 10, minAmount: 0 },
      'SAVE20': { type: 'percentage', value: 20, minAmount: 50 },
      'DOMAIN5': { type: 'fixed', value: 5, minAmount: 0, appliesTo: 'domain' },
    };

    const coupon = validCoupons[code];

    if (!coupon) {
      return errorResponse(res, 'Invalid coupon code', 400);
    }

    if (cart.subtotal < coupon.minAmount) {
      return errorResponse(
        res,
        `Minimum order amount of ${coupon.minAmount} required for this coupon`,
        400
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (cart.subtotal * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }

    cart.discount = Math.min(discount, cart.subtotal);
    cart.coupon = {
      code,
      type: coupon.type,
      value: coupon.value,
      discount: cart.discount,
    };
    cart.total = cart.subtotal - cart.discount + cart.tax;

    cartStorage.set(cartKey, cart);

    return successResponse(res, { cart }, 'Coupon applied successfully');
  } catch (error) {
    logger.error('Apply coupon error:', error);
    return errorResponse(res, 'Failed to apply coupon', 500);
  }
};

/**
 * Remove coupon
 * DELETE /api/cart/coupon
 */
export const removeCoupon = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartKey = getCartKey(userId);
    const cart = cartStorage.get(cartKey);

    if (!cart) {
      return errorResponse(res, 'Cart is empty', 404);
    }

    cart.discount = 0;
    cart.coupon = null;
    cart.total = cart.subtotal + cart.tax;

    cartStorage.set(cartKey, cart);

    return successResponse(res, { cart }, 'Coupon removed');
  } catch (error) {
    logger.error('Remove coupon error:', error);
    return errorResponse(res, 'Failed to remove coupon', 500);
  }
};

/**
 * Checkout - Create order from cart
 * POST /api/cart/checkout
 */
export const checkout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { paymentMethod, billingDetails, domainContacts, termsAgreed } = req.body;

    const cartKey = getCartKey(userId);
    const cart = cartStorage.get(cartKey);

    if (!cart || cart.items.length === 0) {
      return errorResponse(res, 'Cart is empty', 400);
    }

    // Get client
    const client = await Client.findOne({ userId });
    if (!client) {
      return errorResponse(res, 'Client profile not found', 404);
    }

    // Get user for email (Client model doesn't have email)
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check wallet balance if paying with wallet
    if (paymentMethod === 'wallet') {
      if (client.walletBalance < cart.total) {
        return errorResponse(res, 'Insufficient wallet balance', 400);
      }
    }

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

    // Create order
    const order = await Order.create([{
      clientId: client._id,
      orderNumber,
      items: cart.items.map((item) => ({
        type: item.type,
        domainName: item.type === 'domain' ? (item.metadata?.domain || item.name) : undefined,
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        setupFee: 0,
        discount: 0,
        taxAmount: 0,
        total: item.price * item.quantity * item.period,
        configOptions: item.metadata,
      })),
      subtotal: cart.subtotal,
      totalSetupFees: 0,
      totalDiscount: cart.discount,
      totalTax: cart.tax,
      total: cart.total,
      currency: cart.currency,
      promoCode: cart.coupon ? {
        code: cart.coupon,
        discountType: 'fixed',
        discountValue: cart.discount,
      } : undefined,
      status: paymentMethod === 'wallet' ? 'processing' : 'pending',
      paymentMethod,
      billingAddress: billingDetails,
    }]);

    // Log order creation
    await ActivityLog.create({
      userId,
      clientId: client._id,
      action: 'order_create',
      category: 'order',
      description: `Order ${orderNumber} created - awaiting payment`,
      metadata: {
        orderId: order[0]._id,
        orderNumber,
        total: cart.total,
        currency: cart.currency,
        itemsCount: cart.items.length,
        paymentMethod,
        items: cart.items.map(item => ({
          type: item.type,
          name: item.name,
          price: item.price,
        })),
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    // Process payment
    if (paymentMethod === 'wallet') {
      // Deduct from wallet
      client.walletBalance -= cart.total;
      await client.save();

      // Generate unique transaction ID
      const transactionCount = await Transaction.countDocuments();
      const transactionId = `TXN-${new Date().getFullYear()}-${String(transactionCount + 1).padStart(8, '0')}`;

      // Create transaction
      await Transaction.create([{
        transactionId,
        clientId: client._id,
        orderId: order[0]._id,
        type: 'payment',
        gateway: 'wallet',
        amount: cart.total,
        currency: cart.currency,
        fee: 0,
        netAmount: cart.total,
        status: 'success',
        description: `Payment for order ${orderNumber}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }]);

      // Update order status
      order[0].status = 'completed';
      order[0].paymentStatus = 'paid';
      order[0].paidAmount = cart.total;
      order[0].paidAt = new Date();
      await order[0].save();

      // Process domain registrations - Create domain records and queue for registration
      const domainItems = cart.items.filter((item) => item.type === 'domain');
      const domainJobs = [];

      for (const item of domainItems) {
        // Create domain record
        const domain = await Domain.create([{
          clientId: client._id,
          orderId: order[0]._id,
          domainName: item.metadata?.domain || item.name,
          tld: item.metadata?.tld || (item.name ? item.name.split('.').pop() : ''),
          registrationDate: null, // Will be set by worker after successful registration
          expiryDate: new Date(Date.now() + item.period * 365 * 24 * 60 * 60 * 1000),
          autoRenew: item.metadata?.autoRenew !== false,
          yearsPurchased: item.period || 1,
          registrationPrice: item.price,
          renewalPrice: item.price,
          nameservers: item.metadata?.nameServers || [],
          whoisPrivacy: {
            enabled: item.metadata?.privacy !== false,
            price: 0,
          },
          status: 'pending',
        }]);

        // Prepare domain registration data for GoDaddy
        const domainData = {
          domain: domain[0].domainName,
          period: item.period,
          renewAuto: item.metadata.autoRenew !== false,
          privacy: item.metadata.privacy !== false,
          nameServers: item.metadata.nameServers || [],
          contactRegistrant: domainContacts || {
            firstName: client.firstName,
            lastName: client.lastName,
            email: user.email,
            phone: client.phone || '+1.0000000000',
            organization: client.companyName || '',
            address: {
              street: billingDetails?.address || '123 Main St',
              city: billingDetails?.city || 'New York',
              state: billingDetails?.state || 'NY',
              country: billingDetails?.country || 'US',
              zipCode: billingDetails?.zipCode || '10001',
            },
          },
          consent: {
            agreementKeys: ['DNRA', 'DNPA'],
            agreedBy: user.email,
            agreedAt: new Date().toISOString(),
          },
        };

        domainJobs.push({
          domainId: domain[0]._id,
          domainData,
        });
      }

      // Queue domain registration jobs
      for (const job of domainJobs) {
        try {
          await domainRegistrationQueue.add(
            'register-domain',
            {
              orderId: order[0]._id,
              domainId: job.domainId,
              userId,
              domainData: job.domainData,
            },
            {
              priority: 1, // High priority for paid orders
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 5000,
              },
            }
          );

          logger.info(`✅ Queued domain registration for ${job.domainData.domain}`);
        } catch (queueError) {
          logger.error(`Failed to queue domain registration:`, queueError);
          // Mark domain as failed
          await Domain.findByIdAndUpdate(job.domainId, {
            status: 'failed',
            notes: `Failed to queue for registration: ${queueError.message}`,
          });
        }
      }

      // Create activity log
      await ActivityLog.create({
        userId,
        clientId: client._id,
        action: 'order_complete',
        category: 'order',
        description: `Order ${orderNumber} completed with wallet payment`,
        metadata: {
          orderNumber,
          total: cart.total,
          itemsCount: cart.items.length,
          paymentMethod: 'wallet',
          domains: domainItems.length,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });

      // Clear cart
      cartStorage.delete(cartKey);

      return successResponse(res, {
        order: {
          id: order[0]._id,
          orderNumber: order[0].orderNumber,
          status: order[0].status,
          total: order[0].total,
          currency: order[0].currency,
          createdAt: order[0].createdAt,
        },
      }, 'Order created successfully');
    }

    // Handle Razorpay payment
    if (paymentMethod === 'razorpay') {
      try {
        // Convert USD to INR (approximate rate: 1 USD = 83 INR)
        // In production, use a real-time currency conversion API
        const USD_TO_INR_RATE = 83;
        const amountInINR = cart.currency === 'USD'
          ? Math.round(cart.total * USD_TO_INR_RATE * 100) / 100
          : cart.total;

        logger.info(`Creating Razorpay order: ${cart.currency} ${cart.total} → INR ${amountInINR}`);

        // Create Razorpay order (razorpayService will convert to paise)
        const razorpayOrder = await razorpayService.createOrder({
          amount: amountInINR,
          currency: 'INR',
          receipt: order[0].orderNumber,
          notes: {
            orderId: order[0]._id.toString(),
            orderNumber: order[0].orderNumber,
            userId: userId.toString(),
          },
        });

        // Update order with Razorpay order ID
        order[0].razorpayOrderId = razorpayOrder.orderId;
        await order[0].save();

        logger.info(`Razorpay order created: ${razorpayOrder.orderId} for order ${order[0].orderNumber}`);

        return successResponse(res, {
          order: {
            _id: order[0]._id,
            orderNumber: order[0].orderNumber,
            status: order[0].status,
            total: order[0].total,
            currency: order[0].currency,
            razorpayOrderId: razorpayOrder.orderId,
            razorpayAmount: Math.round(amountInINR * 100), // Amount in paise for Razorpay SDK
            razorpayCurrency: 'INR',
            createdAt: order[0].createdAt,
          },
        }, 'Order created, proceed to payment');
      } catch (razorpayError) {
        logger.error('Razorpay order creation failed:', razorpayError);
        // Delete the order if Razorpay order creation fails
        await Order.findByIdAndDelete(order[0]._id);
        return errorResponse(res, 'Failed to create payment order', 500);
      }
    }

    // Log activity
    await ActivityLog.create([{
      userId,
      clientId: client._id,
      action: 'order_create',
      category: 'order',
      description: `Created order ${orderNumber}`,
      metadata: {
        orderNumber,
        total: cart.total,
        itemsCount: cart.items.length,
        paymentMethod,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    }]);

    // Clear cart
    cartStorage.delete(cartKey);

    return successResponse(res, {
      order: {
        id: order[0]._id,
        orderNumber: order[0].orderNumber,
        status: order[0].status,
        total: order[0].total,
        currency: order[0].currency,
        createdAt: order[0].createdAt,
      },
    }, 'Order created successfully');
  } catch (error) {
    logger.error('Checkout error:', error);
    return errorResponse(res, 'Failed to process checkout', 500);
  }
};

/**
 * Verify Razorpay payment and complete order
 * POST /api/cart/verify-payment
 */
export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    // Get client to verify ownership
    const client = await Client.findOne({ userId });
    if (!client || order.clientId.toString() !== client._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Verify payment signature
    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    });

    if (!isValid) {
      logger.warn(`Invalid Razorpay signature for order ${order.orderNumber}`);
      return errorResponse(res, 'Payment verification failed', 400);
    }

    // Get payment details from Razorpay
    const payment = await razorpayService.getPayment(razorpayPaymentId);

    // Get user for email
    const user = await User.findById(userId);

    // Generate unique transaction ID
    const transactionCount = await Transaction.countDocuments();
    const transactionId = `TXN-${new Date().getFullYear()}-${String(transactionCount + 1).padStart(8, '0')}`;

    // Create transaction record
    await Transaction.create([{
      transactionId,
      clientId: client._id,
      orderId: order._id,
      type: 'payment',
      gateway: 'razorpay',
      gatewayTransactionId: razorpayPaymentId,
      gatewayOrderId: razorpayOrderId,
      amount: order.total,
      currency: order.currency,
      fee: 0,
      netAmount: order.total,
      status: 'success',
      description: `Payment for order ${order.orderNumber}`,
      paymentDetails: {
        method: payment.method || 'unknown',
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }]);

    // Update order status
    order.status = 'completed';
    order.paymentStatus = 'paid';
    order.paidAmount = order.total;
    order.paidAt = new Date();
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    // Process domain registrations
    const domainItems = order.items.filter((item) => item.type === 'domain');
    for (const item of domainItems) {
      // Create domain record
      const domain = await Domain.create([{
        clientId: client._id,
        orderId: order._id,
        domainName: item.domainName,
        tld: item.domainName ? item.domainName.split('.').pop() : '',
        registrationDate: null, // Will be set by worker after successful registration
        expiryDate: new Date(Date.now() + (item.billingCycle || 1) * 365 * 24 * 60 * 60 * 1000),
        autoRenew: item.configOptions?.autoRenew !== false,
        yearsPurchased: item.billingCycle || 1,
        registrationPrice: item.unitPrice,
        renewalPrice: item.unitPrice,
        nameservers: item.configOptions?.nameServers || [],
        whoisPrivacy: {
          enabled: item.configOptions?.privacy !== false,
          price: 0,
        },
        status: 'pending',
      }]);

      // Queue domain registration
      try {
        await domainRegistrationQueue.add(
          'register-domain',
          {
            orderId: order._id,
            domainId: domain[0]._id,
            userId,
            domainData: {
              domain: domain[0].domainName,
              period: domain[0].yearsPurchased,
              renewAuto: domain[0].autoRenew,
              privacy: domain[0].whoisPrivacy.enabled,
              nameServers: domain[0].nameservers,
              contactRegistrant: {
                firstName: order.billingAddress?.firstName || client.firstName,
                lastName: order.billingAddress?.lastName || client.lastName,
                email: user.email,
                phone: order.billingAddress?.phone || client.phone || '+1.0000000000',
                organization: client.companyName || '',
                address: {
                  street: order.billingAddress?.street || '123 Main St',
                  city: order.billingAddress?.city || 'New York',
                  state: order.billingAddress?.state || 'NY',
                  country: order.billingAddress?.country || 'US',
                  zipCode: order.billingAddress?.zipCode || '10001',
                },
              },
              consent: {
                agreementKeys: ['DNRA', 'DNPA'],
                agreedBy: user.email,
                agreedAt: new Date().toISOString(),
              },
            },
          },
          {
            priority: 1,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          }
        );

        // Log domain registration activity
        await ActivityLog.create({
          userId,
          clientId: client._id,
          action: 'domain_register',
          category: 'domain',
          description: `Domain ${domain[0].domainName} queued for registration`,
          metadata: {
            domainId: domain[0]._id,
            domainName: domain[0].domainName,
            orderId: order._id,
            period: domain[0].yearsPurchased,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'success',
        });

        logger.info(`✅ Queued domain registration for ${domain[0].domainName}`);
      } catch (queueError) {
        logger.error(`Failed to queue domain registration:`, queueError);
        await Domain.findByIdAndUpdate(domain[0]._id, {
          status: 'failed',
          notes: `Failed to queue for registration: ${queueError.message}`,
        });
      }
    }

    // Generate invoice
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      clientId: client._id,
      orderId: order._id,
      items: order.items.map(item => ({
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxAmount: item.taxAmount || 0,
        total: item.total,
      })),
      subtotal: order.subtotal,
      totalTax: order.totalTax,
      totalDiscount: order.totalDiscount,
      total: order.total,
      currency: order.currency,
      status: 'paid',
      dueDate: new Date(),
      paidAmount: order.total,
      paidAt: new Date(),
      paymentMethod: 'razorpay',
      notes: {
        public: `Payment for order ${order.orderNumber}`,
      },
    });

    // Link invoice to order
    order.invoiceId = invoice._id;
    await order.save();

    logger.info(`✅ Invoice generated: ${invoiceNumber} for order ${order.orderNumber}`);

    // Log invoice generation
    await ActivityLog.create({
      userId,
      clientId: client._id,
      action: 'order_complete',
      category: 'order',
      description: `Invoice ${invoiceNumber} generated for order ${order.orderNumber}`,
      metadata: {
        invoiceId: invoice._id,
        invoiceNumber,
        orderNumber: order.orderNumber,
        total: order.total,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    // Log payment activity
    await ActivityLog.create({
      userId,
      clientId: client._id,
      action: 'payment_success',
      category: 'payment',
      description: `Payment successful for order ${order.orderNumber}`,
      metadata: {
        orderNumber: order.orderNumber,
        amount: order.total,
        razorpayPaymentId,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    // Clear cart
    const cartKey = `cart:${userId}`;
    cartStorage.delete(cartKey);

    logger.info(`Payment verified and order completed: ${order.orderNumber}`);

    return successResponse(res, {
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        currency: order.currency,
        paidAt: order.paidAt,
      },
    }, 'Payment verified successfully');
  } catch (error) {
    logger.error('Payment verification error:', error);
    return errorResponse(res, 'Payment verification failed', 500);
  }
};
