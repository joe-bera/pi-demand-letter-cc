import { Router } from 'express';
import { prisma } from '../db/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import {
  generateChronology,
  getChronology,
  getTimelineData,
} from '../services/chronologyService';

const router = Router();

/**
 * POST /api/cases/:caseId/chronology/generate
 * Generate or regenerate the medical chronology
 */
router.post('/cases/:caseId/chronology/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;

    // Verify case belongs to user's firm
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId,
        firmId: req.user!.firmId,
      }
    });

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Case not found' }
      });
    }

    // Check if there are medical events
    const eventCount = await prisma.medicalEvent.count({ where: { caseId } });
    if (eventCount === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_EVENTS', message: 'No medical events found. Please upload and process medical documents first.' }
      });
    }

    const chronology = await generateChronology(caseId);

    res.json({
      success: true,
      data: chronology
    });
  } catch (error) {
    logger.error('Error generating chronology:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate chronology' }
    });
  }
});

/**
 * GET /api/cases/:caseId/chronology
 * Get the current chronology
 */
router.get('/cases/:caseId/chronology', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;

    // Verify case belongs to user's firm
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId,
        firmId: req.user!.firmId,
      }
    });

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Case not found' }
      });
    }

    const chronology = await getChronology(caseId);

    if (!chronology) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Chronology not generated yet' }
      });
    }

    res.json({
      success: true,
      data: chronology
    });
  } catch (error) {
    logger.error('Error fetching chronology:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch chronology' }
    });
  }
});

/**
 * GET /api/cases/:caseId/chronology/timeline
 * Get timeline data for visualization
 */
router.get('/cases/:caseId/chronology/timeline', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;

    // Verify case belongs to user's firm
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId,
        firmId: req.user!.firmId,
      }
    });

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Case not found' }
      });
    }

    const timelineData = await getTimelineData(caseId);

    res.json({
      success: true,
      data: timelineData
    });
  } catch (error) {
    logger.error('Error fetching timeline:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch timeline' }
    });
  }
});

/**
 * GET /api/cases/:caseId/chronology/gaps
 * Get treatment gaps with explanations
 */
router.get('/cases/:caseId/chronology/gaps', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;

    // Verify case belongs to user's firm
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId,
        firmId: req.user!.firmId,
      }
    });

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Case not found' }
      });
    }

    const chronology = await getChronology(caseId);

    res.json({
      success: true,
      data: {
        gaps: chronology?.treatmentGaps || [],
        hasGaps: (chronology?.treatmentGaps as unknown[])?.length > 0,
      }
    });
  } catch (error) {
    logger.error('Error fetching gaps:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch treatment gaps' }
    });
  }
});

/**
 * GET /api/cases/:caseId/chronology/pain-history
 * Get pain score timeline
 */
router.get('/cases/:caseId/chronology/pain-history', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;

    // Verify case belongs to user's firm
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId,
        firmId: req.user!.firmId,
      }
    });

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Case not found' }
      });
    }

    const chronology = await getChronology(caseId);

    res.json({
      success: true,
      data: chronology?.painScoreHistory || []
    });
  } catch (error) {
    logger.error('Error fetching pain history:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch pain history' }
    });
  }
});

/**
 * GET /api/cases/:caseId/chronology/costs
 * Get cost breakdown
 */
router.get('/cases/:caseId/chronology/costs', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;

    // Verify case belongs to user's firm
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId,
        firmId: req.user!.firmId,
      }
    });

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Case not found' }
      });
    }

    const chronology = await getChronology(caseId);

    // Get detailed cost breakdown from events
    const events = await prisma.medicalEvent.findMany({
      where: { caseId },
      select: {
        dateOfService: true,
        providerName: true,
        providerType: true,
        facilityName: true,
        totalCharge: true,
        insurancePaid: true,
        patientResponsibility: true,
      },
      orderBy: { dateOfService: 'asc' }
    });

    // Group by provider type
    const costsByType: Record<string, number> = {};
    const costsByProvider: Record<string, number> = {};

    for (const event of events) {
      const charge = event.totalCharge ? Number(event.totalCharge) : 0;

      const type = event.providerType || 'Other';
      costsByType[type] = (costsByType[type] || 0) + charge;

      const provider = event.providerName || event.facilityName || 'Unknown';
      costsByProvider[provider] = (costsByProvider[provider] || 0) + charge;
    }

    res.json({
      success: true,
      data: {
        totalCosts: chronology?.totalMedicalCosts ? Number(chronology.totalMedicalCosts) : 0,
        byProviderType: Object.entries(costsByType).map(([type, amount]) => ({ type, amount })),
        byProvider: Object.entries(costsByProvider)
          .map(([provider, amount]) => ({ provider, amount }))
          .sort((a, b) => b.amount - a.amount),
        events: events.map(e => ({
          date: e.dateOfService,
          provider: e.providerName || e.facilityName,
          type: e.providerType,
          charge: e.totalCharge ? Number(e.totalCharge) : 0,
          paid: e.insurancePaid ? Number(e.insurancePaid) : 0,
          balance: e.patientResponsibility ? Number(e.patientResponsibility) : 0,
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching costs:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch cost breakdown' }
    });
  }
});

/**
 * GET /api/cases/:caseId/chronology/narrative
 * Get the chronology narrative for demand letter insertion
 */
router.get('/cases/:caseId/chronology/narrative', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;

    // Verify case belongs to user's firm
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId,
        firmId: req.user!.firmId,
      }
    });

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Case not found' }
      });
    }

    const chronology = await getChronology(caseId);

    if (!chronology) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Chronology not generated yet' }
      });
    }

    res.json({
      success: true,
      data: {
        narrative: chronology.chronologyNarrative,
        executiveSummary: chronology.executiveSummary,
        injuryProgression: chronology.injuryProgression,
      }
    });
  } catch (error) {
    logger.error('Error fetching narrative:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch narrative' }
    });
  }
});

export default router;
