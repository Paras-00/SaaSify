import api from '../config/api';

export const invoiceService = {
  // Get my invoices
  async getMyInvoices(params) {
    const { data } = await api.get('/invoices', { params });
    return data;
  },

  // Get invoice by ID
  async getInvoiceById(id) {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
  },

  // Download invoice PDF
  async downloadInvoicePDF(id) {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Pay invoice
  async payInvoice(id, paymentData) {
    const { data } = await api.post(`/invoices/${id}/pay`, paymentData);
    return data;
  },

  // Admin: Create invoice
  async createInvoice(invoiceData) {
    const { data } = await api.post('/invoices/admin/create', invoiceData);
    return data;
  },

  // Admin: Get all invoices
  async getAllInvoices(params) {
    const { data } = await api.get('/invoices/admin/all', { params });
    return data;
  },

  // Admin: Update invoice
  async updateInvoice(id, updates) {
    const { data } = await api.patch(`/invoices/admin/${id}`, updates);
    return data;
  },

  // Admin: Delete invoice
  async deleteInvoice(id) {
    const { data } = await api.delete(`/invoices/admin/${id}`);
    return data;
  },

  // Admin: Send invoice email
  async sendInvoiceEmail(id) {
    const { data } = await api.post(`/invoices/admin/${id}/send-email`);
    return data;
  },
};
