import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import prisma from '../db/client.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { uploadToS3 } from '../services/storage.js';

const router = Router();

// Configure multer for logo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PNG, JPG, SVG'));
    }
  },
});

// Apply auth middleware to all routes
router.use(requireAuth);

// Validation schemas
const updateFirmSchema = z.object({
  name: z.string().min(1).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  letterheadHtml: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

// GET /api/firm - Get firm details
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const firm = await prisma.firm.findUnique({
      where: { id: req.auth!.firm.id },
      include: {
        _count: {
          select: {
            users: true,
            cases: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: firm,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/firm - Update firm settings (admin only)
router.put(
  '/',
  requireRole('ADMIN'),
  validateBody(updateFirmSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updatedFirm = await prisma.firm.update({
        where: { id: req.auth!.firm.id },
        data: req.body,
      });

      res.json({
        success: true,
        data: updatedFirm,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/firm/logo - Upload firm logo (admin only)
router.post(
  '/logo',
  requireRole('ADMIN'),
  upload.single('logo'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file uploaded' },
        });
      }

      const fileKey = `firms/${req.auth!.firm.id}/logo-${Date.now()}.${file.mimetype.split('/')[1]}`;
      const logoUrl = await uploadToS3(file.buffer, fileKey, file.mimetype);

      const updatedFirm = await prisma.firm.update({
        where: { id: req.auth!.firm.id },
        data: { logoUrl },
      });

      res.json({
        success: true,
        data: updatedFirm,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/firm/users - List firm users (admin only)
router.get(
  '/users',
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const users = await prisma.user.findMany({
        where: { firmId: req.auth!.firm.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              cases: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
