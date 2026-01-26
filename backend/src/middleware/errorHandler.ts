import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    errors?: Record<string, string[]>;
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error(`${req.method} ${req.path}:`, err);

  // Default error response
  let statusCode = 500;
  let response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.error.code = err.code;
    response.error.message = err.message;

    if (err instanceof ValidationError) {
      response.error.errors = err.errors;
    }
  } else if (err.name === 'ZodError') {
    // Handle Zod validation errors
    statusCode = 422;
    response.error.code = 'VALIDATION_ERROR';
    response.error.message = 'Validation failed';
    // @ts-expect-error - Zod error shape
    response.error.errors = err.errors?.reduce((acc: Record<string, string[]>, e: { path: string[]; message: string }) => {
      const path = e.path.join('.');
      if (!acc[path]) acc[path] = [];
      acc[path].push(e.message);
      return acc;
    }, {});
  } else if (err.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma errors
    // @ts-expect-error - Prisma error shape
    const code = err.code;
    if (code === 'P2002') {
      statusCode = 409;
      response.error.code = 'CONFLICT';
      response.error.message = 'A record with this value already exists';
    } else if (code === 'P2025') {
      statusCode = 404;
      response.error.code = 'NOT_FOUND';
      response.error.message = 'Record not found';
    }
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    response.error.message = 'An unexpected error occurred';
  }

  res.status(statusCode).json(response);
}
