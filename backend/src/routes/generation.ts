import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../db/client.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { generateDemandLetter, generateDocument } from '../services/generationService.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// Validation schemas
const generateSchema = z.object({
  documentType: z.enum([
    'DEMAND_LETTER',
    'EXECUTIVE_SUMMARY',
    'GAP_ANALYSIS',
    'TREATMENT_TIMELINE',
    'DAMAGES_WORKSHEET',
  ]),
  tone: z.enum(['cooperative', 'moderate', 'aggressive', 'litigation-ready']).default('moderate'),
  parameters: z.record(z.unknown()).optional(),
});

// POST /api/cases/:caseId/generate - Generate document
router.post(
  '/:caseId',
  validateBody(generateSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;
      const { documentType, tone, parameters } = req.body;

      // Verify case belongs to firm
      const caseData = await prisma.case.findFirst({
        where: {
          id: caseId,
          firmId: req.auth!.firm.id,
        },
        include: {
          documents: {
            where: { processingStatus: 'COMPLETED' },
          },
        },
      });

      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      if (caseData.documents.length === 0) {
        throw new BadRequestError('No processed documents available. Please upload and process documents first.');
      }

      // Get latest version number
      const latestDoc = await prisma.generatedDocument.findFirst({
        where: { caseId, documentType },
        orderBy: { version: 'desc' },
      });

      const version = (latestDoc?.version || 0) + 1;

      logger.info(`Generating ${documentType} for case ${caseId}, version ${version}`);

      // Generate the document
      let result;
      if (documentType === 'DEMAND_LETTER') {
        result = await generateDemandLetter(caseData, tone);
      } else {
        result = await generateDocument(caseData, documentType, tone);
      }

      // Save to database
      const generatedDoc = await prisma.generatedDocument.create({
        data: {
          documentType,
          version,
          tone,
          parameters,
          content: result.content,
          contentHtml: result.contentHtml,
          warnings: result.warnings,
          caseId,
          createdById: req.auth!.user.id,
        },
      });

      // Update case status
      await prisma.case.update({
        where: { id: caseId },
        data: {
          status: 'DRAFT_READY',
          attorneyWarnings: result.warnings,
        },
      });

      res.status(201).json({
        success: true,
        data: generatedDoc,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/cases/:caseId/generated - List generated documents
router.get(
  '/:caseId/generated',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;

      // Verify case belongs to firm
      const caseData = await prisma.case.findFirst({
        where: {
          id: caseId,
          firmId: req.auth!.firm.id,
        },
      });

      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      const documents = await prisma.generatedDocument.findMany({
        where: { caseId },
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/cases/:caseId/generated/:genId - Get specific generated document
router.get(
  '/:caseId/generated/:genId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { caseId, genId } = req.params;

      // Verify case belongs to firm
      const caseData = await prisma.case.findFirst({
        where: {
          id: caseId,
          firmId: req.auth!.firm.id,
        },
      });

      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      const document = await prisma.generatedDocument.findFirst({
        where: {
          id: genId,
          caseId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!document) {
        throw new NotFoundError('Generated document not found');
      }

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/cases/:caseId/generated/:genId/regenerate - Regenerate document
router.post(
  '/:caseId/generated/:genId/regenerate',
  validateBody(generateSchema.partial()),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { caseId, genId } = req.params;
      const { tone, parameters } = req.body;

      // Get existing document
      const existingDoc = await prisma.generatedDocument.findFirst({
        where: {
          id: genId,
          caseId,
        },
      });

      if (!existingDoc) {
        throw new NotFoundError('Generated document not found');
      }

      // Get case with documents
      const caseData = await prisma.case.findFirst({
        where: {
          id: caseId,
          firmId: req.auth!.firm.id,
        },
        include: {
          documents: {
            where: { processingStatus: 'COMPLETED' },
          },
        },
      });

      if (!caseData) {
        throw new NotFoundError('Case not found');
      }

      const newTone = tone || existingDoc.tone;
      const documentType = existingDoc.documentType;

      // Generate new version
      let result;
      if (documentType === 'DEMAND_LETTER') {
        result = await generateDemandLetter(caseData, newTone);
      } else {
        result = await generateDocument(caseData, documentType, newTone);
      }

      // Save new version
      const generatedDoc = await prisma.generatedDocument.create({
        data: {
          documentType,
          version: existingDoc.version + 1,
          tone: newTone,
          parameters: parameters || existingDoc.parameters,
          content: result.content,
          contentHtml: result.contentHtml,
          warnings: result.warnings,
          caseId,
          createdById: req.auth!.user.id,
        },
      });

      res.status(201).json({
        success: true,
        data: generatedDoc,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
