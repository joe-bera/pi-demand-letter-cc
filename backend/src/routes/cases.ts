import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../db/client.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// Validation schemas
const createCaseSchema = z.object({
  clientFirstName: z.string().min(1, 'First name is required'),
  clientLastName: z.string().min(1, 'Last name is required'),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  clientDateOfBirth: z.string().datetime().optional(),
  clientAddress: z.string().optional(),
  incidentDate: z.string().datetime(),
  incidentType: z.string().default('auto_accident'),
  incidentLocation: z.string().optional(),
  incidentDescription: z.string().optional(),
  defendantName: z.string().optional(),
  defendantInsuranceCompany: z.string().optional(),
  claimNumber: z.string().optional(),
  jurisdiction: z.string().default('CA'),
});

const updateCaseSchema = createCaseSchema.partial();

// GET /api/cases - List cases
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', status, search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {
      firmId: req.auth!.firm.id,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { clientFirstName: { contains: search as string, mode: 'insensitive' } },
        { clientLastName: { contains: search as string, mode: 'insensitive' } },
        { caseNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              documents: true,
              generatedDocuments: true,
            },
          },
        },
      }),
      prisma.case.count({ where }),
    ]);

    res.json({
      success: true,
      data: cases,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cases/:id - Get case details
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const caseData = await prisma.case.findFirst({
      where: {
        id: req.params.id as string,
        firmId: req.auth!.firm.id,
      },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        generatedDocuments: {
          orderBy: { createdAt: 'desc' },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!caseData) {
      throw new NotFoundError('Case not found');
    }

    res.json({
      success: true,
      data: caseData,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/cases - Create new case
router.post(
  '/',
  validateBody(createCaseSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const newCase = await prisma.case.create({
        data: {
          ...req.body,
          incidentDate: new Date(req.body.incidentDate),
          clientDateOfBirth: req.body.clientDateOfBirth
            ? new Date(req.body.clientDateOfBirth)
            : null,
          firmId: req.auth!.firm.id,
          createdById: req.auth!.user.id,
        },
      });

      res.status(201).json({
        success: true,
        data: newCase,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/cases/:id - Update case
router.put(
  '/:id',
  validateBody(updateCaseSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Verify case belongs to firm
      const existingCase = await prisma.case.findFirst({
        where: {
          id: req.params.id as string,
          firmId: req.auth!.firm.id,
        },
      });

      if (!existingCase) {
        throw new NotFoundError('Case not found');
      }

      const updatedCase = await prisma.case.update({
        where: { id: req.params.id as string },
        data: {
          ...req.body,
          incidentDate: req.body.incidentDate
            ? new Date(req.body.incidentDate)
            : undefined,
          clientDateOfBirth: req.body.clientDateOfBirth
            ? new Date(req.body.clientDateOfBirth)
            : undefined,
        },
      });

      res.json({
        success: true,
        data: updatedCase,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/cases/:id - Delete case (soft delete by setting status to CLOSED)
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const existingCase = await prisma.case.findFirst({
      where: {
        id: req.params.id as string,
        firmId: req.auth!.firm.id,
      },
    });

    if (!existingCase) {
      throw new NotFoundError('Case not found');
    }

    await prisma.case.update({
      where: { id: req.params.id as string },
      data: { status: 'CLOSED' },
    });

    res.json({
      success: true,
      message: 'Case closed successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
