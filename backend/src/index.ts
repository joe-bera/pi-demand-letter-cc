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
const PORT = process.env.PORT || 3001;

// CORS configuration - must be before other middleware
// Allow Vercel preview deployments and production
app.use(cors({
  origin: true, // Allow all origins for now (can restrict later)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Security middleware (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Clerk authentication middleware
app.use(clerkMiddleware());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check (no auth required)
app.use('/api/health', healthRouter);

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

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
