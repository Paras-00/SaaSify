import api from '../config/api';

export const domainService = {
  // Search domains
  async searchDomains(query) {
    const { data } = await api.get('/domains/search', { params: { query } });
    return data;
  },

  // Check domain availability
  async checkAvailability(domain) {
    const { data } = await api.get('/domains/availability', { params: { domain } });
    return data;
  },

  // Get domain suggestions
  async getDomainSuggestions(keyword) {
    const { data } = await api.get('/domains/suggestions', { params: { keyword } });
    return data;
  },

  // Get domain pricing
  async getDomainPricing(tld) {
    const { data } = await api.get('/domains/pricing', { params: { tld } });
    return data;
  },

  // Get my domains
  async getMyDomains(params) {
    const { data } = await api.get('/domains/my-domains', { params });
    return data;
  },

  // Get domain by ID
  async getDomainById(id) {
    const { data } = await api.get(`/domains/${id}`);
    return data;
  },

  // Get supported TLDs
  async getSupportedTLDs() {
    const { data } = await api.get('/domains/tlds');
    return data;
  },

  // Initiate domain transfer
  async initiateTransfer(domain, authCode) {
    const { data } = await api.post('/domains/transfer', { domain, authCode });
    return data;
  },

  // Get transfer status
  async getTransferStatus(domain) {
    const { data } = await api.get(`/domains/${domain}/transfer-status`);
    return data;
  },

  // List DNS records
  async listDNSRecords(domain) {
    const { data } = await api.get(`/domains/${domain}/dns`);
    return data;
  },

  // Add/Update DNS record
  async upsertDNSRecord(domain, record) {
    const { data } = await api.post(`/domains/${domain}/dns`, record);
    return data;
  },

  // Delete DNS record
  async deleteDNSRecord(domain, recordType, name) {
    const { data } = await api.delete(`/domains/${domain}/dns`, {
      data: { type: recordType, name },
    });
    return data;
  },

  // Update domain contacts
  async updateContacts(domain, contacts) {
    const { data } = await api.patch(`/domains/${domain}/contacts`, contacts);
    return data;
  },

  // Set domain lock
  async setDomainLock(domain, locked) {
    const { data } = await api.patch(`/domains/${domain}/lock`, { locked });
    return data;
  },

  // Set domain forwarding
  async setForwarding(domain, forwardTo) {
    const { data } = await api.post(`/domains/${domain}/forwarding`, { forwardTo });
    return data;
  },

  // Remove domain forwarding
  async removeForwarding(domain) {
    const { data } = await api.delete(`/domains/${domain}/forwarding`);
    return data;
  },

  // Renew domain
  async renewDomain(domain, period) {
    const { data } = await api.post(`/domains/${domain}/renew`, { period });
    return data;
  },
};
