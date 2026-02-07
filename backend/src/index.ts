import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';

import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import casesRouter from './routes/cases.js';
import documentsRouter from './routes/documents.js';
import generationRouter from './routes/generation.js';
import exportRouter from './routes/export.js';
import firmRouter from './routes/firm.js';
import healthRouter from './routes/health.js';
import medicalEventsRouter from './routes/medicalEvents.js';
import chronologyRouter from './routes/chronology.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// CORS configuration - must be FIRST
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://pi-demand-letter-cc.vercel.app',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Simple root test endpoint - no middleware needed
app.get('/', (_req, res) => {
  res.json({ status: 'Backend is running', timestamp: new Date().toISOString() });
});

// Health check BEFORE other middleware
app.use('/api/health', healthRouter);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Body parsing - needed before Clerk
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Clerk authentication middleware (only for API routes that need it)
app.use('/api/cases', clerkMiddleware());
app.use('/api/documents', clerkMiddleware());
app.use('/api/generate', clerkMiddleware());
app.use('/api/export', clerkMiddleware());
app.use('/api/firm', clerkMiddleware());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Request logging
app.use(requestLogger);

// API routes
app.use('/api/cases', casesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/generate', generationRouter);
app.use('/api/export', exportRouter);
app.use('/api/firm', firmRouter);
app.use('/api', medicalEventsRouter);
app.use('/api', chronologyRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Listening on 0.0.0.0:${PORT}`);
});

export default app;
