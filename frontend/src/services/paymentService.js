import api from '../config/api';

export const paymentService = {
  // Razorpay: Create order
  async createRazorpayOrder(orderData) {
    const { data } = await api.post('/payments/razorpay/create-order', orderData);
    return data;
  },

  // Razorpay: Verify payment
  async verifyRazorpayPayment(paymentData) {
    const { data } = await api.post('/payments/razorpay/verify', paymentData);
    return data;
  },

  // Stripe: Create payment intent
  async createStripeIntent(intentData) {
    const { data } = await api.post('/payments/stripe/create-intent', intentData);
    return data;
  },

  // Stripe: Confirm payment
  async confirmStripePayment(paymentData) {
    const { data } = await api.post('/payments/stripe/confirm', paymentData);
    return data;
  },

  // Stripe: Get config
  async getStripeConfig() {
    const { data } = await api.get('/payments/stripe/config');
    return data;
  },

  // Create refund (admin)
  async createRefund(refundData) {
    const { data } = await api.post('/payments/refund', refundData);
    return data;
  },

  // Get refund status
  async getRefundStatus(refundId) {
    const { data } = await api.get(`/payments/refund/${refundId}`);
    return data;
  },
};
