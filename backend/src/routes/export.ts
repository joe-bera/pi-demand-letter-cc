import { Router, Response, NextFunction } from 'express';
import prisma from '../db/client.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { NotFoundError } from '../utils/errors.js';
import { generateDocx, generatePdf } from '../services/exportService.js';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// GET /api/export/:caseId/:genId/docx - Export to Word
router.get(
  '/:caseId/:genId/docx',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { caseId, genId } = req.params;

      // Verify case belongs to firm
      const caseData = await prisma.case.findFirst({
        where: {
          id: caseId,
          firmId: req.auth!.firm.id,
        },
        include: {
          firm: true,
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
      });

      if (!document) {
        throw new NotFoundError('Generated document not found');
      }

      const docxBuffer = await generateDocx(document.content, caseData.firm);

      const filename = `${caseData.clientLastName}_${caseData.clientFirstName}_${document.documentType}_v${document.version}.docx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(docxBuffer);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/export/:caseId/:genId/pdf - Export to PDF
router.get(
  '/:caseId/:genId/pdf',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { caseId, genId } = req.params;

      // Verify case belongs to firm
      const caseData = await prisma.case.findFirst({
        where: {
          id: caseId,
          firmId: req.auth!.firm.id,
        },
        include: {
          firm: true,
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
      });

      if (!document) {
        throw new NotFoundError('Generated document not found');
      }

      const pdfBuffer = await generatePdf(document.content, caseData.firm);

      const filename = `${caseData.clientLastName}_${caseData.clientFirstName}_${document.documentType}_v${document.version}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
