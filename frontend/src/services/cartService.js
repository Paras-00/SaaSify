import api from '../config/api';

export const cartService = {
  // Get cart
  async getCart() {
    const { data } = await api.get('/cart');
    return data;
  },

  // Add item to cart
  async addToCart(item) {
    const { data } = await api.post('/cart/add', item);
    return data;
  },

  // Update cart item
  async updateCartItem(itemId, updates) {
    const { data } = await api.patch(`/cart/item/${itemId}`, updates);
    return data;
  },

  // Remove from cart
  async removeFromCart(itemId) {
    const { data } = await api.delete(`/cart/item/${itemId}`);
    return data;
  },

  // Clear cart
  async clearCart() {
    const { data } = await api.delete('/cart/clear');
    return data;
  },

  // Apply coupon
  async applyCoupon(code) {
    const { data } = await api.post('/cart/coupon', { code });
    return data;
  },

  // Remove coupon
  async removeCoupon() {
    const { data } = await api.delete('/cart/coupon');
    return data;
  },

  // Checkout
  async checkout(checkoutData) {
    const { data } = await api.post('/cart/checkout', checkoutData);
    return data;
  },
};
