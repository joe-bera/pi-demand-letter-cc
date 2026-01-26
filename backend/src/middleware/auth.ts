import { Request, Response, NextFunction } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import prisma from '../db/client.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
    user: {
      id: string;
      clerkId: string;
      email: string;
      name: string;
      role: string;
      firmId: string;
    };
    firm: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Use Clerk's getAuth to get authentication info from the request
    const authInfo = getAuth(req);

    if (!authInfo || !authInfo.userId) {
      throw new UnauthorizedError('Not authenticated');
    }

    // Get or create user in our database
    const user = await prisma.user.findUnique({
      where: { clerkId: authInfo.userId },
      include: { firm: true },
    });

    if (!user) {
      // User exists in Clerk but not in our DB - they need to be onboarded
      throw new UnauthorizedError('User not found. Please complete onboarding.');
    }

    req.auth = {
      userId: user.id,
      sessionId: authInfo.sessionId || '',
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        role: user.role,
        firmId: user.firmId,
      },
      firm: {
        id: user.firm.id,
        name: user.firm.name,
        slug: user.firm.slug,
      },
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      next(error);
    } else {
      logger.error('Auth error:', error);
      next(new UnauthorizedError('Authentication failed'));
    }
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    if (!roles.includes(req.auth.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}

// Re-export clerkClient for use elsewhere
export { clerkClient };
