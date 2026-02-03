import { authenticateToken, optionalAuth } from '../../models/middleware/auth.middleware.js';
import {
  checkAvailability,
  getDomainById,
  getDomainPricing,
  getDomainSuggestions,
  getMyDomains,
  getSupportedTLDs,
  searchDomains,
} from './domain.controller.js';
import {
  contactUpdateSchema,
  dnsRecordsSchema,
  domainLockSchema,
  domainTransferSchema,
  forwardingSchema,
} from './domain.validation.js';
import {
  domainAvailabilitySchema,
  domainPricingSchema,
  domainSearchSchema,
  domainSuggestionsSchema,
} from './domain.validation.js';

import express from 'express';
import { validate } from '../../models/middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/domains/search
 * @desc    Search for domains
 * @access  Public (optional auth for activity logging)
 */
router.get('/search', optionalAuth, validate(domainSearchSchema, 'query'), searchDomains);

/**
 * @route   GET /api/domains/availability/:domain
 * @desc    Check domain availability
 * @access  Public (optional auth for activity logging)
 */
router.get('/availability/:domain', optionalAuth, checkAvailability);

/**
 * @route   GET /api/domains/suggestions
 * @desc    Get domain suggestions
 * @access  Public (optional auth for activity logging)
 */
router.get(
  '/suggestions',
  optionalAuth,
  validate(domainSuggestionsSchema, 'query'),
  getDomainSuggestions
);

/**
 * @route   GET /api/domains/pricing/:tld
 * @desc    Get domain pricing for specific TLD
 * @access  Public
 */
router.get('/pricing/:tld', getDomainPricing);

/**
 * @route   GET /api/domains/tlds
 * @desc    Get list of supported TLDs with pricing
 * @access  Public
 */
router.get('/tlds', getSupportedTLDs);

/**
 * @route   GET /api/domains/my-domains
 * @desc    Get user's registered domains
 * @access  Private
 */
router.get('/my-domains', authenticateToken, getMyDomains);

/**
 * @route   GET /api/domains/:id
 * @desc    Get domain details by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, getDomainById);

/**
 * @route   POST /api/domains/transfer
 * @desc    Initiate domain transfer
 * @access  Private
 */
router.post(
  '/transfer',
  authenticateToken,
  validate(domainTransferSchema, 'body'),
  // controller -> initiateTransfer
  async (req, res, next) => {
    try {
      const mod = await import('./domain.controller.js');
      return mod.initiateTransfer(req, res);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   GET /api/domains/transfer/status/:domain
 * @desc    Get transfer status for a domain
 * @access  Private
 */
router.get('/transfer/status/:domain', authenticateToken, async (req, res, next) => {
  try {
    const mod = await import('./domain.controller.js');
    return mod.getTransferStatus(req, res);
  } catch (err) {
    next(err);
  }
});

/** DNS management */
router.get('/dns/:domain', authenticateToken, async (req, res, next) => {
  try {
    const mod = await import('./domain.controller.js');
    return mod.listDNSRecords(req, res);
  } catch (err) {
    next(err);
  }
});

router.put('/dns/:domain', authenticateToken, validate(dnsRecordsSchema, 'body'), async (req, res, next) => {
  try {
    const mod = await import('./domain.controller.js');
    return mod.upsertDNSRecord(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete('/dns/:domain/:type/:name', authenticateToken, async (req, res, next) => {
  try {
    const mod = await import('./domain.controller.js');
    return mod.deleteDNSRecord(req, res);
  } catch (err) {
    next(err);
  }
});

/** Contacts */
router.patch('/contacts/:domain', authenticateToken, validate(contactUpdateSchema, 'body'), async (req, res, next) => {
  try {
    const mod = await import('./domain.controller.js');
    return mod.updateContacts(req, res);
  } catch (err) {
    next(err);
  }
});

/** Lock/unlock */
router.post('/lock/:domain', authenticateToken, validate(domainLockSchema, 'body'), async (req, res, next) => {
  try {
    const mod = await import('./domain.controller.js');
    return mod.setLock(req, res);
  } catch (err) {
    next(err);
  }
});

/** Forwarding */
router.put('/forwarding/:domain', authenticateToken, validate(forwardingSchema, 'body'), async (req, res, next) => {
  try {
    const mod = await import('./domain.controller.js');
    return mod.setForwarding(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete('/forwarding/:domain', authenticateToken, async (req, res, next) => {
  try {
    const mod = await import('./domain.controller.js');
    return mod.removeForwarding(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
