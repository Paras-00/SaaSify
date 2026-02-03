import api from '../config/api';

export const walletService = {
  // Get wallet balance
  async getWalletBalance() {
    const { data } = await api.get('/wallet/balance');
    return data;
  },

  // Get wallet transactions
  async getWalletTransactions(params) {
    const { data } = await api.get('/wallet/transactions', { params });
    return data;
  },

  // Add funds to wallet
  async addFunds(fundData) {
    const { data } = await api.post('/wallet/add-funds', fundData);
    return data;
  },

  // Pay invoice from wallet
  async payInvoiceFromWallet(invoiceId) {
    const { data } = await api.post('/wallet/pay-invoice', { invoiceId });
    return data;
  },

  // Admin: Adjust wallet balance
  async adjustWalletBalance(adjustmentData) {
    const { data } = await api.post('/wallet/admin/adjust', adjustmentData);
    return data;
  },

  // Admin: Get all wallet transactions
  async getAllWalletTransactions(params) {
    const { data } = await api.get('/wallet/admin/transactions', { params });
    return data;
  },
};
