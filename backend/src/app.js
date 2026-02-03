import { errorHandler, notFound } from './models/middleware/errorHandler.middleware.js';

import adminRoutes from './modules/admin/admin.routes.js';
import { apiLimiterMiddleware as apiLimiter } from './models/middleware/rateLimit.middleware.js';
// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import clientRoutes from './modules/clients/client.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import domainRoutes from './modules/domains/domain.routes.js';
import express from 'express';
import helmet from 'helmet';
import logger from './utils/logger.js';
import morgan from 'morgan';

const app = express();

// Trust proxy (for production behind Nginx)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
  },
}));

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser
app.use(cookieParser());

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Health Check (no rate limit)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/cart', cartRoutes);
// app.use('/api/services', serviceRoutes);
// app.use('/api/payments', paymentRoutes);

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Hosting Platform API v1.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      clients: '/api/clients',
      admin: '/api/admin',
      domains: '/api/domains',
      cart: '/api/cart',
      products: '/api/products',
      services: '/api/services',
      orders: '/api/orders',
      invoices: '/api/invoices',
      payments: '/api/payments',
    },
  });
});

// 404 Handler
app.use(notFound);

// Error Handler (must be last)
app.use(errorHandler);

export default app;
