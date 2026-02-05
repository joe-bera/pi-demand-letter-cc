import { Router } from 'express';
import { prisma } from '../db/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import {
  getMedicalEventsForCase,
  updateMedicalEvent,
  deleteMedicalEvent,
} from '../services/medicalEventService';

const router = Router();

/**
 * GET /api/cases/:caseId/medical-events
 * List all medical events for a case
 */
router.get('/cases/:caseId/medical-events', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const { providerType, startDate, endDate, sortBy = 'dateOfService', sortOrder = 'asc' } = req.query;

    // Verify case belongs to user's firm
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId as string,
        firmId: req.auth!.user.firmId,
      }
    });

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Case not found' }
      });
    }

    // Build query
    const where: Record<string, unknown> = { caseId: caseId as string };

    if (providerType) {
      where.providerType = providerType;
    }

    if (startDate || endDate) {
      where.dateOfService = {};
      if (startDate) {
        (where.dateOfService as Record<string, Date>).gte = new Date(startDate as string);
      }
      if (endDate) {
        (where.dateOfService as Record<string, Date>).lte = new Date(endDate as string);
      }
    }

    const events = await prisma.medicalEvent.findMany({
      where,
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        document: {
          select: {
            id: true,
            originalFilename: true,
            category: true,
          }
        }
      }
    });

    // Calculate summary stats
    const totalCosts = events.reduce((sum, e) => sum + (e.totalCharge ? Number(e.totalCharge) : 0), 0);
    const uniqueProviders = new Set(events.map(e => e.providerName).filter(Boolean)).size;
    const dateRange = events.length > 0 ? {
      start: events[0].dateOfService,
      end: events[events.length - 1].dateOfService,
    } : null;

    res.json({
      success: true,
      data: {
        events,
        summary: {
          totalEvents: events.length,
          totalCosts,
          uniqueProviders,
          dateRange,
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching medical events:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch medical events' }
    });
  }
});

/**
 * GET /api/cases/:caseId/medical-events/:eventId
 * Get a single medical event
 */
router.get('/cases/:caseId/medical-events/:eventId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId, eventId } = req.params;

    // Verify case belongs to user's firm
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId as string,
        firmId: req.auth!.user.firmId,
      }
    });

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Case not found' }
      });
    }

    const event = await prisma.medicalEvent.findFirst({
      where: {
        id: eventId as string,
        caseId: caseId as string,
      },
      include: {
        document: {
          select: {
            id: true,
            originalFilename: true,
            category: true,
            fileUrl: true,
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Medical event not found' }
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Error fetching medical event:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch medical event' }
    });
  }
});

/**
 * PUT /api/cases/:caseId/medical-events/:eventId
 * Update a medical event (attorney corrections)
 */
router.put('/cases/:caseId/medical-events/:eventId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId, eventId } = req.params;
    const updateData = req.body;

    // Verify case belongs to user's firm
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId as string,
        firmId: req.auth!.user.firmId,
      }
    });

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Case not found' }
      });
    }

    // Verify event exists and belongs to case
    const existingEvent = await prisma.medicalEvent.findFirst({
      where: { id: eventId as string, caseId: caseId as string }
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Medical event not found' }
      });
    }

    // Update allowed fields
    const allowedFields = [
      'dateOfService', 'providerName', 'providerType', 'facilityName', 'documentType',
      'chiefComplaint', 'diagnoses', 'treatmentsProcedures', 'medications', 'imagingTests',
      'vitalSigns', 'subjectiveFindings', 'objectiveFindings', 'assessment', 'plan',
      'workStatus', 'workRestrictions', 'functionalLimitations', 'prognosis',
      'permanencyStatements', 'futureTreatment', 'preExistingMentions', 'keyQuotes',
      'redFlags', 'causationStatements', 'totalCharge', 'insurancePaid', 'patientResponsibility'
    ];

    const filteredData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    // Convert date string to Date object if provided
    if (filteredData.dateOfService && typeof filteredData.dateOfService === 'string') {
      filteredData.dateOfService = new Date(filteredData.dateOfService);
    }

    const updatedEvent = await updateMedicalEvent(eventId as string, filteredData);

    res.json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    logger.error('Error updating medical event:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update medical event' }
    });
  }
});

/**
 * DELETE /api/cases/:caseId/medical-events/:eventId
 * Delete a medical event
 */
router.delete('/cases/:caseId/medical-events/:eventId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId, eventId } = req.params;

    // Verify case belongs to user's firm
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId as string,
        firmId: req.auth!.user.firmId,
      }
    });

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Case not found' }
      });
    }

    // Verify event exists and belongs to case
    const existingEvent = await prisma.medicalEvent.findFirst({
      where: { id: eventId as string, caseId: caseId as string }
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Medical event not found' }
      });
    }

    await deleteMedicalEvent(eventId as string);

    res.json({
      success: true,
      message: 'Medical event deleted'
    });
  } catch (error) {
    logger.error('Error deleting medical event:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete medical event' }
    });
  }
});

export default router;
