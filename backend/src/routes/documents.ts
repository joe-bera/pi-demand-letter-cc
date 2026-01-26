import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/client.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { uploadToS3, deleteFromS3, getSignedUrl } from '../services/storage.js';
import { processDocument } from '../services/documentProcessor.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Invalid file type. Allowed: PDF, PNG, JPG, DOCX'));
    }
  },
});

// Apply auth middleware to all routes
router.use(requireAuth);

// POST /api/cases/:caseId/documents - Upload documents
router.post(
  '/:caseId',
  upload.array('files', 20),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new BadRequestError('No files uploaded');
      }

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

      const documents = await Promise.all(
        files.map(async (file) => {
          const fileKey = `${req.auth!.firm.id}/${caseId}/${uuidv4()}-${file.originalname}`;

          // Upload to S3
          const fileUrl = await uploadToS3(file.buffer, fileKey, file.mimetype);

          // Create document record
          const document = await prisma.document.create({
            data: {
              filename: fileKey,
              originalFilename: file.originalname,
              fileUrl,
              fileSize: file.size,
              mimeType: file.mimetype,
              category: 'OTHER', // Will be classified by AI
              caseId,
              processingStatus: 'PENDING',
            },
          });

          // Trigger async processing
          processDocument(document.id).catch((err) => {
            logger.error(`Failed to process document ${document.id}:`, err);
          });

          return document;
        })
      );

      // Update case status
      await prisma.case.update({
        where: { id: caseId },
        data: { status: 'DOCUMENTS_UPLOADED' },
      });

      res.status(201).json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/cases/:caseId/documents - List case documents
router.get(
  '/:caseId',
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

      const documents = await prisma.document.findMany({
        where: { caseId },
        orderBy: { createdAt: 'desc' },
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

// GET /api/cases/:caseId/documents/:docId - Get document details
router.get(
  '/:caseId/:docId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { caseId, docId } = req.params;

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

      const document = await prisma.document.findFirst({
        where: {
          id: docId,
          caseId,
        },
      });

      if (!document) {
        throw new NotFoundError('Document not found');
      }

      // Generate signed URL for download
      const downloadUrl = await getSignedUrl(document.filename);

      res.json({
        success: true,
        data: {
          ...document,
          downloadUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/cases/:caseId/documents/:docId - Delete document
router.delete(
  '/:caseId/:docId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { caseId, docId } = req.params;

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

      const document = await prisma.document.findFirst({
        where: {
          id: docId,
          caseId,
        },
      });

      if (!document) {
        throw new NotFoundError('Document not found');
      }

      // Delete from S3
      await deleteFromS3(document.filename);

      // Delete from database
      await prisma.document.delete({
        where: { id: docId },
      });

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/cases/:caseId/documents/process - Trigger reprocessing of all documents
router.post(
  '/:caseId/process',
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

      // Get all pending documents
      const documents = await prisma.document.findMany({
        where: {
          caseId,
          processingStatus: { in: ['PENDING', 'FAILED'] },
        },
      });

      // Update case status
      await prisma.case.update({
        where: { id: caseId },
        data: { status: 'PROCESSING' },
      });

      // Trigger processing for each document
      documents.forEach((doc) => {
        processDocument(doc.id).catch((err) => {
          logger.error(`Failed to process document ${doc.id}:`, err);
        });
      });

      res.json({
        success: true,
        message: `Processing triggered for ${documents.length} documents`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
