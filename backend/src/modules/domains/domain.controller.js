import { errorResponse, successResponse } from '../../utils/response.js';

import ActivityLog from '../models/ActivityLog.js';
import Domain from '../models/Domain.js';
import godaddyService from '../../services/godaddy.service.js';
import logger from '../../utils/logger.js';

/**
 * Search domains
 * GET /api/domains/search
 */
export const searchDomains = async (req, res) => {
  try {
    const { query, tlds, maxResults, checkAvailability } = req.query;
    const userId = req.user?.userId;

    // Validate domain format
    const validation = godaddyService.validateDomainFormat(query);
    
    let results = [];

    if (validation.isValid && validation.tld) {
      // Direct domain lookup
      const availability = await godaddyService.checkAvailability(query);
      results.push(availability);

      // Log activity
      if (userId) {
        await ActivityLog.create({
          userId,
          action: 'domain_search',
          category: 'domain',
          description: `Searched for domain: ${query}`,
          metadata: { query, available: availability.available },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'success',
        });
      }
    } else {
      // Get suggestions for keyword
      const selectedTlds = tlds || ['.com', '.net', '.org', '.io', '.co'];
      const suggestions = await godaddyService.getDomainSuggestions(query, {
        tlds: selectedTlds,
        maxResults: parseInt(maxResults) || 20,
      });

      // Check availability for suggestions if requested
      if (checkAvailability === 'true' && suggestions.length > 0) {
        const domains = suggestions.map((s) => s.domain);
        const availabilityResults = await godaddyService.checkBulkAvailability(
          domains.slice(0, 10)
        );

        // Get pricing for available domains
        const tldSet = new Set();
        availabilityResults.forEach((result) => {
          const tld = result.domain.split('.').pop();
          tldSet.add(tld);
        });

        const pricingPromises = Array.from(tldSet).map((tld) =>
          godaddyService.getDomainPricing(tld)
        );
        const pricingResults = await Promise.allSettled(pricingPromises);
        const pricingMap = {};

        pricingResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            pricingMap[Array.from(tldSet)[index]] = result.value;
          }
        });

        results = availabilityResults.map((result) => {
          const tld = result.domain.split('.').pop();
          const pricing = pricingMap[tld];

          return {
            ...result,
            price: pricing?.prices?.registration?.[1] || result.price,
            renewalPrice: pricing?.prices?.renewal?.[1] || null,
          };
        });
      } else {
        results = suggestions;
      }

      // Log activity
      if (userId) {
        await ActivityLog.create({
          userId,
          action: 'domain_search',
          category: 'domain',
          description: `Searched for domains with keyword: ${query}`,
          metadata: { query, resultsCount: results.length },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'success',
        });
      }
    }

    return successResponse(res, 'Domain search completed', {
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    logger.error('Domain search error:', error);
    return errorResponse(res, 'Failed to search domains', 500);
  }
};

/**
 * Check domain availability
 * GET /api/domains/availability/:domain
 */
export const checkAvailability = async (req, res) => {
  try {
    const { domain } = req.params;
    const userId = req.user?.userId;

    // Validate domain format
    const validation = godaddyService.validateDomainFormat(domain);
    if (!validation.isValid) {
      return errorResponse(res, validation.errors[0] || 'Invalid domain format', 400);
    }

    // Check availability
    const availability = await godaddyService.checkAvailability(domain);

    // Get pricing
    const tld = domain.split('.').pop();
    const pricing = await godaddyService.getDomainPricing(tld);

    // Log activity
    if (userId) {
      await ActivityLog.create({
        userId,
        action: 'domain_search',
        category: 'domain',
        description: `Checked availability for domain: ${domain}`,
        metadata: { domain, available: availability.available },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });
    }

    return successResponse(res, 'Domain availability checked', {
      domain: availability.domain,
      available: availability.available,
      price: pricing.prices.registration[1],
      renewalPrice: pricing.prices.renewal[1],
      transferPrice: pricing.prices.transfer[1],
      currency: pricing.prices.registration.currency,
      period: 1,
    });
  } catch (error) {
    logger.error('Domain availability check error:', error);
    return errorResponse(res, 'Failed to check domain availability', 500);
  }
};

/**
 * Get domain suggestions
 * GET /api/domains/suggestions
 */
export const getDomainSuggestions = async (req, res) => {
  try {
    const { query, tlds, maxResults, lengthMin, lengthMax } = req.query;
    const userId = req.user?.userId;

    const suggestions = await godaddyService.getDomainSuggestions(query, {
      tlds: tlds || ['.com', '.net', '.org', '.io', '.co'],
      maxResults: parseInt(maxResults) || 20,
      lengthMin: parseInt(lengthMin) || 4,
      lengthMax: parseInt(lengthMax) || 25,
    });

    // Get pricing for unique TLDs
    const tldSet = new Set();
    suggestions.forEach((s) => {
      const tld = s.domain.split('.').pop();
      tldSet.add(tld);
    });

    const pricingPromises = Array.from(tldSet).map((tld) =>
      godaddyService.getDomainPricing(tld)
    );
    const pricingResults = await Promise.allSettled(pricingPromises);
    const pricingMap = {};

    pricingResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        pricingMap[Array.from(tldSet)[index]] = result.value;
      }
    });

    const results = suggestions.map((suggestion) => {
      const tld = suggestion.domain.split('.').pop();
      const pricing = pricingMap[tld];

      return {
        domain: suggestion.domain,
        available: true,
        price: pricing?.prices?.registration?.[1] || null,
        renewalPrice: pricing?.prices?.renewal?.[1] || null,
        currency: pricing?.prices?.registration?.currency || 'USD',
      };
    });

    // Log activity
    if (userId) {
      await ActivityLog.create({
        userId,
        action: 'domain_search',
        category: 'domain',
        description: `Got domain suggestions for: ${query}`,
        metadata: { query, count: results.length },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });
    }

    return successResponse(res, 'Domain suggestions retrieved', {
      query,
      suggestions: results,
      count: results.length,
    });
  } catch (error) {
    logger.error('Domain suggestions error:', error);
    return errorResponse(res, 'Failed to get domain suggestions', 500);
  }
};

/**
 * Get domain pricing
 * GET /api/domains/pricing/:tld
 */
export const getDomainPricing = async (req, res) => {
  try {
    const { tld } = req.params;

    const pricing = await godaddyService.getDomainPricing(tld);

    return successResponse(res, 'Domain pricing retrieved', {
      tld: pricing.tld,
      type: pricing.type,
      pricing: {
        registration: {
          1: pricing.prices.registration[1],
          currency: pricing.prices.registration.currency,
        },
        renewal: {
          1: pricing.prices.renewal[1],
          currency: pricing.prices.renewal.currency,
        },
        transfer: {
          1: pricing.prices.transfer[1],
          currency: pricing.prices.transfer.currency,
        },
      },
    });
  } catch (error) {
    logger.error('Domain pricing error:', error);
    return errorResponse(res, 'Failed to get domain pricing', 500);
  }
};

/**
 * Get user's domains
 * GET /api/domains/my-domains
 */
export const getMyDomains = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, status, search } = req.query;

    const query = { userId };

    // Apply filters
    if (status) query.status = status;
    if (search) {
      query.domainName = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [domains, total] = await Promise.all([
      Domain.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Domain.countDocuments(query),
    ]);

    return successResponse(res, 'Domains retrieved successfully', {
      domains,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get my domains error:', error);
    return errorResponse(res, 'Failed to retrieve domains', 500);
  }
};

/**
 * Get domain details by ID
 * GET /api/domains/:id
 */
export const getDomainById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const domain = await Domain.findOne({ _id: id, userId }).lean();

    if (!domain) {
      return errorResponse(res, 'Domain not found', 404);
    }

    // Get live status from GoDaddy if domain is active
    if (domain.status === 'active' && domain.registrarDomainId) {
      try {
        const liveDetails = await godaddyService.getDomainDetails(domain.domainName);
        domain.liveStatus = liveDetails;
      } catch (error) {
        logger.warn(`Failed to fetch live domain details for ${domain.domainName}`);
      }
    }

    return successResponse(res, 'Domain details retrieved', { domain });
  } catch (error) {
    logger.error('Get domain by ID error:', error);
    return errorResponse(res, 'Failed to retrieve domain details', 500);
  }
};

/**
 * Get supported TLDs
 * GET /api/domains/tlds
 */
export const getSupportedTLDs = async (req, res) => {
  try {
    const tlds = godaddyService.getSupportedTLDs();

    // Get pricing for all TLDs
    const pricingPromises = tlds.map((tld) =>
      godaddyService.getDomainPricing(tld.replace('.', ''))
    );
    const pricingResults = await Promise.allSettled(pricingPromises);

    const tldList = tlds.map((tld, index) => {
      const pricing =
        pricingResults[index].status === 'fulfilled'
          ? pricingResults[index].value
          : null;

      return {
        tld,
        price: pricing?.prices?.registration?.[1] || null,
        renewalPrice: pricing?.prices?.renewal?.[1] || null,
        currency: pricing?.prices?.registration?.currency || 'USD',
        type: pricing?.type || 'GENERIC',
      };
    });

    return successResponse(res, 'Supported TLDs retrieved', {
      tlds: tldList,
      count: tldList.length,
    });
  } catch (error) {
    logger.error('Get supported TLDs error:', error);
    return errorResponse(res, 'Failed to retrieve TLDs', 500);
  }
};

/**
 * Initiate domain transfer
 * POST /api/domains/transfer
 */
export const initiateTransfer = async (req, res) => {
  try {
    const userId = req.user.userId;
    const transferData = req.body;

    const result = await godaddyService.initiateTransfer(transferData);

    // Log activity
    if (userId) {
      await ActivityLog.create({
        userId,
        action: 'domain_transfer_initiated',
        category: 'domain',
        description: `Initiated transfer for ${transferData.domain}`,
        metadata: { transferResult: result },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'pending',
      });
    }

    return successResponse(res, 'Domain transfer initiated', { result });
  } catch (error) {
    logger.error('Initiate transfer error:', error);
    return errorResponse(res, error.message || 'Failed to initiate transfer', 500);
  }
};

/**
 * Get transfer status
 * GET /api/domains/transfer/status/:domain
 */
export const getTransferStatus = async (req, res) => {
  try {
    const { domain } = req.params;
    const status = await godaddyService.getTransferStatus(domain);
    return successResponse(res, 'Transfer status retrieved', { domain, status });
  } catch (error) {
    logger.error('Get transfer status error:', error);
    return errorResponse(res, 'Failed to get transfer status', 500);
  }
};

/**
 * List DNS records
 * GET /api/domains/dns/:domain
 */
export const listDNSRecords = async (req, res) => {
  try {
    const { domain } = req.params;
    const records = await godaddyService.listDNSRecords(domain);
    return successResponse(res, 'DNS records retrieved', { domain, records });
  } catch (error) {
    logger.error('List DNS records error:', error);
    return errorResponse(res, 'Failed to list DNS records', 500);
  }
};

/**
 * Add or update DNS record
 * PUT /api/domains/dns/:domain
 */
export const upsertDNSRecord = async (req, res) => {
  try {
    const { domain } = req.params;
    const record = req.body.record || req.body;
    const result = await godaddyService.upsertDNSRecord(domain, record);

    // Log activity
    if (req.user?.userId) {
      await ActivityLog.create({
        userId: req.user.userId,
        action: 'dns_upsert',
        category: 'domain',
        description: `Upserted DNS record for ${domain}`,
        metadata: { record },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });
    }

    return successResponse(res, 'DNS record upserted', { result });
  } catch (error) {
    logger.error('Upsert DNS record error:', error);
    return errorResponse(res, 'Failed to upsert DNS record', 500);
  }
};

/**
 * Delete DNS record
 * DELETE /api/domains/dns/:domain/:type/:name
 */
export const deleteDNSRecord = async (req, res) => {
  try {
    const { domain, type, name } = req.params;
    const result = await godaddyService.deleteDNSRecord(domain, type, name);

    if (req.user?.userId) {
      await ActivityLog.create({
        userId: req.user.userId,
        action: 'dns_delete',
        category: 'domain',
        description: `Deleted DNS record ${type}/${name} for ${domain}`,
        metadata: { type, name },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });
    }

    return successResponse(res, 'DNS record deleted', { result });
  } catch (error) {
    logger.error('Delete DNS record error:', error);
    return errorResponse(res, 'Failed to delete DNS record', 500);
  }
};

/**
 * Update contacts for a domain
 * PATCH /api/domains/contacts/:domain
 */
export const updateContacts = async (req, res) => {
  try {
    const { domain } = req.params;
    const contacts = req.body;

    const result = await godaddyService.updateContacts(domain, contacts);

    if (req.user?.userId) {
      await ActivityLog.create({
        userId: req.user.userId,
        action: 'contacts_update',
        category: 'domain',
        description: `Updated contacts for ${domain}`,
        metadata: { contacts },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });
    }

    return successResponse(res, 'Domain contacts updated', { result });
  } catch (error) {
    logger.error('Update contacts error:', error);
    return errorResponse(res, 'Failed to update contacts', 500);
  }
};

/**
 * Set lock/unlock on domain
 * POST /api/domains/lock/:domain
 */
export const setLock = async (req, res) => {
  try {
    const { domain } = req.params;
    const { lock } = req.body;

    const result = await godaddyService.setDomainLock(domain, !!lock);

    if (req.user?.userId) {
      await ActivityLog.create({
        userId: req.user.userId,
        action: lock ? 'domain_lock' : 'domain_unlock',
        category: 'domain',
        description: `${lock ? 'Locked' : 'Unlocked'} domain ${domain}`,
        metadata: { lock },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });
    }

    return successResponse(res, 'Domain lock status updated', { result });
  } catch (error) {
    logger.error('Set lock error:', error);
    return errorResponse(res, 'Failed to set domain lock', 500);
  }
};

/**
 * Set forwarding
 * PUT /api/domains/forwarding/:domain
 */
export const setForwarding = async (req, res) => {
  try {
    const { domain } = req.params;
    const forwarding = req.body;

    const result = await godaddyService.updateForwarding(domain, forwarding);

    if (req.user?.userId) {
      await ActivityLog.create({
        userId: req.user.userId,
        action: 'forwarding_update',
        category: 'domain',
        description: `Updated forwarding for ${domain}`,
        metadata: { forwarding },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });
    }

    return successResponse(res, 'Forwarding updated', { result });
  } catch (error) {
    logger.error('Set forwarding error:', error);
    return errorResponse(res, 'Failed to set forwarding', 500);
  }
};

/**
 * Remove forwarding
 * DELETE /api/domains/forwarding/:domain
 */
export const removeForwarding = async (req, res) => {
  try {
    const { domain } = req.params;

    const result = await godaddyService.updateForwarding(domain, { enabled: false });

    if (req.user?.userId) {
      await ActivityLog.create({
        userId: req.user.userId,
        action: 'forwarding_remove',
        category: 'domain',
        description: `Removed forwarding for ${domain}`,
        metadata: {},
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });
    }

    return successResponse(res, 'Forwarding removed', { result });
  } catch (error) {
    logger.error('Remove forwarding error:', error);
    return errorResponse(res, 'Failed to remove forwarding', 500);
  }
};
