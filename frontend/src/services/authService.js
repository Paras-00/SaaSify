import api from '../config/api';

export const authService = {
  // Register new user
  async register(userData) {
    const { data } = await api.post('/auth/register', userData);
    if (data.data.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
    }
    return data;
  },

  // Login user
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    if (data.data.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
    }
    return data;
  },

  // Verify Login 2FA
  async verifyLogin2FA(email, code) {
    const { data } = await api.post('/auth/verify-login-2fa', { email, code });
    if (data.data.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
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

  // Update profile
  async updateProfile(profileData) {
    const { data } = await api.patch('/clients/me', profileData);
    return data;
  },

  // Change password
  async changePassword(passwordData) {
    const { data } = await api.post('/auth/change-password', passwordData);
    return data;
  },

  // Enable 2FA
  async enable2FA() {
    const { data } = await api.post('/auth/enable-2fa');
    return data;
  },

  // Verify 2FA
  async verify2FA(code) {
    const { data } = await api.post('/auth/verify-2fa', { code });
    return data;
  },

  // Disable 2FA
  async disable2FA(code) {
    const { data } = await api.post('/auth/disable-2fa', { code });
    return data;
  },

  // Setup 2FA (Get QR Code)
  async setup2FA(token) {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    const { data } = await api.post('/auth/enable-2fa', {}, config);
    return data;
  },

  // Verify 2FA Setup
  async verify2FASetup(token, otp) {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    const { data } = await api.post('/auth/verify-2fa', { code: otp }, config);
    if (data.data && data.data.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
    }
    return data;
  },

  // Refresh token
  async refreshToken() {
    const { data } = await api.post('/auth/refresh-token');
    if (data.data.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
    }
    return data;
  },
};

export default authService;
