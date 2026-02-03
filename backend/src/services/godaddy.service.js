import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * GoDaddy API Service
 * Handles all interactions with GoDaddy Domain API
 */
class GoDaddyService {
  constructor() {
    this.apiKey = process.env.GODADDY_API_KEY;
    this.apiSecret = process.env.GODADDY_API_SECRET;
    this.baseURL = process.env.GODADDY_API_URL || 'https://api.godaddy.com';
    this.isProduction = process.env.GODADDY_ENV === 'production';

    if (!this.apiKey || !this.apiSecret) {
      logger.warn('GoDaddy API credentials not configured. Domain features will be limited.');
    }

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `sso-key ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          logger.error('GoDaddy API Error:', {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url,
          });
        } else if (error.request) {
          logger.error('GoDaddy API Request Error:', {
            message: error.message,
            url: error.config?.url,
          });
        }
        throw error;
      }
    );
  }

  /**
   * Initiate domain transfer into account
   * @param {Object} transferData - Transfer data including domain and authCode
   */
  async initiateTransfer(transferData) {
    try {
      const response = await this.client.post('/v1/domains/transfers', transferData);

      return {
        success: true,
        transferId: response.data.transferId || null,
        domain: response.data.domain || transferData.domain,
        message: response.data.message || 'Transfer initiated',
      };
    } catch (error) {
      logger.error('Initiate transfer failed:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to initiate transfer');
    }
  }

  /**
   * Get transfer status for a domain
   * @param {string} domain
   */
  async getTransferStatus(domain) {
    try {
      const response = await this.client.get(`/v1/domains/${domain}/transfer`);

      return response.data;
    } catch (error) {
      logger.error(`Get transfer status failed for ${domain}:`, error.message);
      // Fallback: return basic domain details
      try {
        const details = await this.getDomainDetails(domain);
        return { status: details.status || 'unknown' };
      } catch (e) {
        throw new Error('Failed to get transfer status');
      }
    }
  }

  /**
   * List DNS records for a domain
   * @param {string} domain
   */
  async listDNSRecords(domain) {
    try {
      const response = await this.client.get(`/v1/domains/${domain}/records`);
      return response.data;
    } catch (error) {
      logger.error(`List DNS records failed for ${domain}:`, error.message);
      throw new Error('Failed to list DNS records');
    }
  }

  /**
   * Add or update a DNS record for a domain
   * @param {string} domain
   * @param {Object} record - { type, name, data, ttl, priority }
   */
  async upsertDNSRecord(domain, record) {
    try {
      // GoDaddy uses PUT to /records/{type}/{name} with an array of records
      const { type, name } = record;
      await this.client.put(`/v1/domains/${domain}/records/${type}/${name}`, [record]);
      return { success: true, domain, record };
    } catch (error) {
      logger.error(`Upsert DNS record failed for ${domain}:`, error.message);
      throw new Error('Failed to upsert DNS record');
    }
  }

  /**
   * Delete a DNS record by type/name
   * @param {string} domain
   * @param {string} type
   * @param {string} name
   */
  async deleteDNSRecord(domain, type, name) {
    try {
      // Delete by setting empty array for that type/name
      await this.client.put(`/v1/domains/${domain}/records/${type}/${name}`, []);
      return { success: true, domain, type, name };
    } catch (error) {
      logger.error(`Delete DNS record failed for ${domain}:`, error.message);
      throw new Error('Failed to delete DNS record');
    }
  }

  /**
   * Lock or unlock domain
   * @param {string} domain
   * @param {boolean} locked
   */
  async setDomainLock(domain, locked = true) {
    try {
      await this.client.patch(`/v1/domains/${domain}`, { locked });
      return { success: true, domain, locked };
    } catch (error) {
      logger.error(`Set domain lock failed for ${domain}:`, error.message);
      throw new Error('Failed to set domain lock');
    }
  }

  /**
   * Update contact information for a domain
   * @param {string} domain
   * @param {Object} contacts
   */
  async updateContacts(domain, contacts) {
    try {
      await this.client.put(`/v1/domains/${domain}/contacts`, contacts);
      return { success: true, domain };
    } catch (error) {
      logger.error(`Update contacts failed for ${domain}:`, error.message);
      throw new Error('Failed to update domain contacts');
    }
  }

  /**
   * Update domain forwarding
   * @param {string} domain
   * @param {Object} forwarding - { forwardTo, type, mask }
   */
  async updateForwarding(domain, forwarding) {
    try {
      await this.client.put(`/v1/domains/${domain}/forwarding`, forwarding);
      return { success: true, domain, forwarding };
    } catch (error) {
      logger.error(`Update forwarding failed for ${domain}:`, error.message);
      throw new Error('Failed to update domain forwarding');
    }
  }

  /**
   * Check if domain is available for registration
   * @param {string} domain - Domain name to check (e.g., 'example.com')
   * @returns {Promise<Object>} - Availability status
   */
  async checkAvailability(domain) {
    try {
      const response = await this.client.get(`/v1/domains/available`, {
        params: {
          domain,
          checkType: 'FULL',
          forTransfer: false,
        },
      });

      return {
        domain: response.data.domain,
        available: response.data.available,
        price: response.data.price || null,
        currency: response.data.currency || 'USD',
        period: response.data.period || 1,
        definitive: response.data.definitive || false,
      };
    } catch (error) {
      logger.error(`Domain availability check failed for ${domain}:`, error.message);
      throw new Error('Failed to check domain availability');
    }
  }

  /**
   * Check availability for multiple domains
   * @param {Array<string>} domains - Array of domain names
   * @returns {Promise<Array<Object>>} - Array of availability results
   */
  async checkBulkAvailability(domains) {
    try {
      const response = await this.client.post('/v1/domains/available', domains);

      return response.data.domains.map((domain) => ({
        domain: domain.domain,
        available: domain.available,
        price: domain.price || null,
        currency: domain.currency || 'USD',
        period: domain.period || 1,
        definitive: domain.definitive || false,
      }));
    } catch (error) {
      logger.error('Bulk domain availability check failed:', error.message);
      throw new Error('Failed to check domain availability');
    }
  }

  /**
   * Get domain suggestions based on keywords
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array<Object>>} - Array of domain suggestions
   */
  async getDomainSuggestions(query, options = {}) {
    try {
      const {
        maxResults = 20,
        tlds = ['.com', '.net', '.org', '.io', '.co'],
        waitMs = 1000,
      } = options;

      const response = await this.client.get('/v1/domains/suggest', {
        params: {
          query,
          country: 'US',
          city: options.city || 'New York',
          sources: options.sources || 'CC_TLD',
          tlds: tlds.join(','),
          lengthMax: options.lengthMax || 25,
          lengthMin: options.lengthMin || 4,
          limit: maxResults,
          waitMs,
        },
      });

      return response.data.map((suggestion) => ({
        domain: suggestion.domain,
        available: true,
        price: null, // Need to check pricing separately
        currency: 'USD',
      }));
    } catch (error) {
      logger.error('Domain suggestions failed:', error.message);
      throw new Error('Failed to get domain suggestions');
    }
  }

  /**
   * Get domain pricing for specific TLD
   * @param {string} tld - Top-level domain (e.g., 'com', 'net')
   * @returns {Promise<Object>} - Pricing information
   */
  async getDomainPricing(tld) {
    try {
      // Remove leading dot if present
      const cleanTld = tld.replace(/^\./, '');

      const response = await this.client.get(`/v1/domains/tlds/${cleanTld}`);

      return {
        tld: response.data.name,
        type: response.data.type,
        prices: {
          registration: {
            1: response.data.prices?.registration?.price || null,
            currency: response.data.prices?.registration?.currency || 'USD',
          },
          renewal: {
            1: response.data.prices?.renewal?.price || null,
            currency: response.data.prices?.renewal?.currency || 'USD',
          },
          transfer: {
            1: response.data.prices?.transfer?.price || null,
            currency: response.data.prices?.transfer?.currency || 'USD',
          },
        },
      };
    } catch (error) {
      logger.error(`Domain pricing failed for TLD ${tld}:`, error.message);
      // Return fallback pricing if API fails
      return this.getFallbackPricing(tld);
    }
  }

  /**
   * Get fallback pricing when API is unavailable
   * @param {string} tld - Top-level domain
   * @returns {Object} - Fallback pricing
   */
  getFallbackPricing(tld) {
    const cleanTld = tld.replace(/^\./, '').toLowerCase();
    
    const fallbackPrices = {
      com: { registration: 12.99, renewal: 14.99, transfer: 12.99 },
      net: { registration: 13.99, renewal: 15.99, transfer: 13.99 },
      org: { registration: 14.99, renewal: 16.99, transfer: 14.99 },
      io: { registration: 39.99, renewal: 49.99, transfer: 39.99 },
      co: { registration: 24.99, renewal: 29.99, transfer: 24.99 },
      app: { registration: 19.99, renewal: 24.99, transfer: 19.99 },
      dev: { registration: 14.99, renewal: 19.99, transfer: 14.99 },
      ai: { registration: 99.99, renewal: 119.99, transfer: 99.99 },
      xyz: { registration: 1.99, renewal: 12.99, transfer: 1.99 },
      online: { registration: 2.99, renewal: 39.99, transfer: 2.99 },
    };

    const prices = fallbackPrices[cleanTld] || { registration: 14.99, renewal: 16.99, transfer: 14.99 };

    return {
      tld: cleanTld,
      type: 'GENERIC',
      prices: {
        registration: { 1: prices.registration, currency: 'USD' },
        renewal: { 1: prices.renewal, currency: 'USD' },
        transfer: { 1: prices.transfer, currency: 'USD' },
      },
    };
  }

  /**
   * Purchase/Register a domain
   * @param {Object} domainData - Domain registration data
   * @returns {Promise<Object>} - Registration result
   */
  async registerDomain(domainData) {
    try {
      const {
        domain,
        period = 1,
        nameServers = [],
        renewAuto = true,
        privacy = true,
        consent = {},
        contactAdmin,
        contactBilling,
        contactRegistrant,
        contactTech,
      } = domainData;

      const purchaseData = {
        domain,
        period,
        nameServers: nameServers.length > 0 ? nameServers : undefined,
        renewAuto,
        privacy,
        consent: {
          agreementKeys: consent.agreementKeys || [],
          agreedBy: consent.agreedBy,
          agreedAt: consent.agreedAt || new Date().toISOString(),
        },
        contactAdmin: contactAdmin || contactRegistrant,
        contactBilling: contactBilling || contactRegistrant,
        contactRegistrant,
        contactTech: contactTech || contactRegistrant,
      };

      const response = await this.client.post('/v1/domains/purchase', purchaseData);

      return {
        success: true,
        orderId: response.data.orderId,
        domain: response.data.domain || domain,
        itemCount: response.data.itemCount || 1,
        total: response.data.total,
        currency: response.data.currency || 'USD',
      };
    } catch (error) {
      logger.error('Domain registration failed:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to register domain');
    }
  }

  /**
   * Get domain details
   * @param {string} domain - Domain name
   * @returns {Promise<Object>} - Domain details
   */
  async getDomainDetails(domain) {
    try {
      const response = await this.client.get(`/v1/domains/${domain}`);

      return {
        domain: response.data.domain,
        domainId: response.data.domainId,
        status: response.data.status,
        expires: response.data.expires,
        renewAuto: response.data.renewAuto,
        renewDeadline: response.data.renewDeadline,
        privacy: response.data.privacy,
        locked: response.data.locked,
        nameServers: response.data.nameServers || [],
        createdAt: response.data.createdAt,
      };
    } catch (error) {
      logger.error(`Get domain details failed for ${domain}:`, error.message);
      throw new Error('Failed to get domain details');
    }
  }

  /**
   * Renew a domain
   * @param {string} domain - Domain name
   * @param {number} period - Renewal period in years
   * @returns {Promise<Object>} - Renewal result
   */
  async renewDomain(domain, period = 1) {
    try {
      const response = await this.client.post(`/v1/domains/${domain}/renew`, {
        period,
      });

      return {
        success: true,
        orderId: response.data.orderId,
        domain,
        period,
        total: response.data.total,
        currency: response.data.currency || 'USD',
      };
    } catch (error) {
      logger.error(`Domain renewal failed for ${domain}:`, error.message);
      throw new Error('Failed to renew domain');
    }
  }

  /**
   * Update domain nameservers
   * @param {string} domain - Domain name
   * @param {Array<string>} nameServers - Array of nameserver hostnames
   * @returns {Promise<Object>} - Update result
   */
  async updateNameServers(domain, nameServers) {
    try {
      await this.client.patch(`/v1/domains/${domain}`, {
        nameServers,
      });

      return {
        success: true,
        domain,
        nameServers,
      };
    } catch (error) {
      logger.error(`Update nameservers failed for ${domain}:`, error.message);
      throw new Error('Failed to update nameservers');
    }
  }

  /**
   * Get domain contacts
   * @param {string} domain - Domain name
   * @returns {Promise<Object>} - Domain contacts
   */
  async getDomainContacts(domain) {
    try {
      const response = await this.client.get(`/v1/domains/${domain}/contacts`);

      return {
        contactAdmin: response.data.contactAdmin,
        contactBilling: response.data.contactBilling,
        contactRegistrant: response.data.contactRegistrant,
        contactTech: response.data.contactTech,
      };
    } catch (error) {
      logger.error(`Get domain contacts failed for ${domain}:`, error.message);
      throw new Error('Failed to get domain contacts');
    }
  }

  /**
   * Update privacy settings
   * @param {string} domain - Domain name
   * @param {boolean} privacy - Enable/disable privacy
   * @returns {Promise<Object>} - Update result
   */
  async updatePrivacy(domain, privacy) {
    try {
      await this.client.patch(`/v1/domains/${domain}`, {
        privacy,
      });

      return {
        success: true,
        domain,
        privacy,
      };
    } catch (error) {
      logger.error(`Update privacy failed for ${domain}:`, error.message);
      throw new Error('Failed to update privacy settings');
    }
  }

  /**
   * Validate domain name format
   * @param {string} domain - Domain name to validate
   * @returns {Object} - Validation result
   */
  validateDomainFormat(domain) {
    // Remove protocol if present
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Domain regex pattern
    const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

    const isValid = domainPattern.test(cleanDomain);
    const parts = cleanDomain.split('.');
    const tld = parts.length > 1 ? `.${parts[parts.length - 1]}` : null;
    const sld = parts.length > 1 ? parts[parts.length - 2] : null;

    return {
      isValid,
      domain: cleanDomain,
      tld,
      sld,
      errors: !isValid
        ? ['Invalid domain format. Please use format: example.com']
        : [],
    };
  }

  /**
   * Get supported TLDs list
   * @returns {Array<string>} - List of supported TLDs
   */
  getSupportedTLDs() {
    return [
      '.com', '.net', '.org', '.io', '.co', '.app', '.dev', '.ai',
      '.xyz', '.online', '.store', '.tech', '.site', '.website',
      '.space', '.club', '.info', '.biz', '.us', '.uk', '.ca',
    ];
  }
}

// Export singleton instance
const godaddyService = new GoDaddyService();
export default godaddyService;
