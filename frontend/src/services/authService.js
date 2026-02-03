import api from '../config/api';

export const authService = {
  // Register new user
  async register(userData) {
    const { data } = await api.post('/auth/register', userData);
    if (data.data.tokens) {
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
    }
    return data;
  },

  // Login user
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    if (data.data.tokens) {
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
    }
    return data;
  },

  // Logout user
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
    }
  },

  // Verify email
  async verifyEmail(token) {
    const { data } = await api.post('/auth/verify-email', { token });
    return data;
  },

  // Resend verification email
  async resendVerification() {
    const { data } = await api.post('/auth/resend-verification');
    return data;
  },

  // Request password reset
  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  // Reset password
  async resetPassword(token, password) {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  },

  // Get current user
  async getCurrentUser() {
    const { data } = await api.get('/auth/me');
    return data;
  },

  // Enable 2FA
  async enable2FA() {
    const { data } = await api.post('/auth/2fa/enable');
    return data;
  },

  // Verify 2FA
  async verify2FA(token) {
    const { data } = await api.post('/auth/2fa/verify', { token });
    return data;
  },

  // Disable 2FA
  async disable2FA(token) {
    const { data } = await api.post('/auth/2fa/disable', { token });
    return data;
  },

  // Refresh token
  async refreshToken() {
    const { data } = await api.post('/auth/refresh');
    if (data.data.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
    }
    return data;
  },
};
