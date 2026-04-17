import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes, { publicCategoriesRouter } from './routes/adminRoutes.js';
import { getPublicSettings } from './controllers/settingsController.js';
import { getSitemap, safeSeoInterceptor, getProductSeoMetadata } from './controllers/seoController.js';

import { prisma } from './utils/prisma.js';

const app = express();

// Trust proxy for secure sessions/cookies behind Vercel/Railway
app.set('trust proxy', 1);

// Ensure tmp uploads directory exists
if (!fs.existsSync('/tmp/uploads')) {
  fs.mkdirSync('/tmp/uploads', { recursive: true });
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://*.cloudinary.com'],
        connectSrc: ["'self'", config.frontendUrl, 'https://hetmarketing.tech', 'https://www.hetmarketing.tech'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
const allowedOrigins = [
  config.frontendUrl, 
  'https://hetmarketing.tech', 
  'https://www.hetmarketing.tech',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || 
                        origin.endsWith('.vercel.app'); // Allow all Vercel preview domains

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
app.use('/api/', generalLimiter);

// HTTPS redirect (when not behind reverse proxy)
app.use((req, res, next) => {
  if (
    config.nodeEnv === 'production' &&
    req.headers['x-forwarded-proto'] !== 'https' &&
    !req.headers.host?.includes('localhost')
  ) {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
    return;
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', publicCategoriesRouter);
app.get('/api/settings', getPublicSettings);

// SEO Routes
app.get('/sitemap.xml', getSitemap);
app.get('/api/seo/metadata/:slug', getProductSeoMetadata);
app.get('/seo-products/:slug', safeSeoInterceptor); // Safe SSR tag injector endpoint

// Catch-all to serve statically if needed (though mostly Vercel handles this in prod)
// app.get('*', ...) can break the API structure if deployed as Monolith. 
// We are restricting the crawler proxy to a specific endpoint.

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Verify database connection before starting
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
    
    app.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
      console.log(`Server running on port ${config.port}`);
      console.log('Database connected');
    });
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    console.error('FATAL: Could not connect to database on startup.');
    console.error(error);
    process.exit(1);
  }
};

startServer();

export default app;
