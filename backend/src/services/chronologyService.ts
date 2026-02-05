import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../db/client';
import { MedicalEvent, MedicalChronology, Case } from '@prisma/client';
import { logger } from '../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

const anthropic = new Anthropic();

interface TreatmentGap {
  startDate: string;
  endDate: string;
  durationDays: number;
  explanation?: string;
  impact?: string;
}

interface PainScoreEntry {
  date: string;
  score: number;
  provider?: string;
  notes?: string;
}

interface ProviderSummary {
  name: string;
  type: string;
  visitCount: number;
  totalCost: number;
}

interface DiagnosisSummary {
  diagnosis: string;
  icdCode?: string;
  bodyPart?: string;
  firstDate: string;
  lastDate: string;
  mentionCount: number;
}

interface BodyPartSummary {
  bodyPart: string;
  diagnoses: string[];
  treatments: string[];
}

/**
 * Generate or update the medical chronology for a case
 */
export async function generateChronology(caseId: string): Promise<MedicalChronology> {
  logger.info(`Generating chronology for case ${caseId}`);

  // Get all medical events for the case
  const events = await prisma.medicalEvent.findMany({
    where: { caseId },
    orderBy: { dateOfService: 'asc' }
  });

  if (events.length === 0) {
    throw new Error('No medical events found for this case');
  }

  // Get case info for context
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      clientFirstName: true,
      clientLastName: true,
      incidentDate: true,
      incidentType: true,
      incidentDescription: true,
    }
  });

  if (!caseData) {
    throw new Error('Case not found');
  }

  // Calculate summary statistics
  const firstVisitDate = events[0].dateOfService;
  const lastVisitDate = events[events.length - 1].dateOfService;
  const treatmentDurationDays = Math.ceil(
    (lastVisitDate.getTime() - firstVisitDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalVisits = events.length;

  // Calculate total costs
  const totalMedicalCosts = events.reduce((sum, e) => {
    const charge = e.totalCharge ? Number(e.totalCharge) : 0;
    return sum + charge;
  }, 0);

  // Detect treatment gaps (> 30 days)
  const treatmentGaps = detectTreatmentGaps(events);

  // Generate gap explanations using AI
  const gapsWithExplanations = await generateGapExplanations(treatmentGaps, events, caseData);

  // Extract pain score history
  const painScoreHistory = extractPainScoreHistory(events);

  // Generate provider summary
  const providersSummary = generateProviderSummary(events);

  // Generate diagnosis summary
  const diagnosisSummary = generateDiagnosisSummary(events);

  // Generate body parts summary
  const bodyPartsAffected = generateBodyPartsSummary(events);

  // Detect MMI (Maximum Medical Improvement)
  const mmiInfo = detectMMI(events);

  // Generate narrative using AI
  const narrative = await generateChronologyNarrative(
    events,
    caseData,
    {
      treatmentDurationDays,
      totalVisits,
      totalMedicalCosts,
      treatmentGaps: gapsWithExplanations,
      providersSummary,
      diagnosisSummary,
    }
  );

  // Generate executive summary
  const executiveSummary = await generateExecutiveSummary(
    events,
    caseData,
    {
      treatmentDurationDays,
      totalVisits,
      totalMedicalCosts,
      diagnosisSummary,
    }
  );

  // Upsert the chronology
  const chronology = await prisma.medicalChronology.upsert({
    where: { caseId },
    create: {
      caseId,
      treatmentDurationDays,
      totalVisits,
      totalMedicalCosts,
      firstVisitDate,
      lastVisitDate,
      executiveSummary,
      chronologyNarrative: narrative,
      treatmentGaps: gapsWithExplanations,
      mmiDate: mmiInfo.mmiDate,
      mmiNotes: mmiInfo.mmiNotes,
      mmiReached: mmiInfo.mmiReached,
      painScoreHistory,
      providersSummary,
      bodyPartsAffected,
      diagnosisSummary,
    },
    update: {
      treatmentDurationDays,
      totalVisits,
      totalMedicalCosts,
      firstVisitDate,
      lastVisitDate,
      executiveSummary,
      chronologyNarrative: narrative,
      treatmentGaps: gapsWithExplanations,
      mmiDate: mmiInfo.mmiDate,
      mmiNotes: mmiInfo.mmiNotes,
      mmiReached: mmiInfo.mmiReached,
      painScoreHistory,
      providersSummary,
      bodyPartsAffected,
      diagnosisSummary,
      updatedAt: new Date(),
    }
  });

  // Update case status
  await prisma.case.update({
    where: { id: caseId },
    data: { status: 'EXTRACTION_COMPLETE' }
  });

  logger.info(`Chronology generated for case ${caseId}`);
  return chronology;
}

/**
 * Get chronology for a case
 */
export async function getChronology(caseId: string): Promise<MedicalChronology | null> {
  return prisma.medicalChronology.findUnique({
    where: { caseId }
  });
}

/**
 * Get timeline data for visualization
 */
export async function getTimelineData(caseId: string) {
  const events = await prisma.medicalEvent.findMany({
    where: { caseId },
    orderBy: { dateOfService: 'asc' },
    select: {
      id: true,
      dateOfService: true,
      providerName: true,
      providerType: true,
      facilityName: true,
      documentType: true,
      diagnoses: true,
      treatmentsProcedures: true,
      vitalSigns: true,
      totalCharge: true,
    }
  });

  const chronology = await prisma.medicalChronology.findUnique({
    where: { caseId },
    select: {
      treatmentGaps: true,
      firstVisitDate: true,
      lastVisitDate: true,
    }
  });

  return {
    events,
    gaps: chronology?.treatmentGaps || [],
    dateRange: {
      start: chronology?.firstVisitDate,
      end: chronology?.lastVisitDate,
    }
  };
}

// Helper functions

function detectTreatmentGaps(events: MedicalEvent[]): TreatmentGap[] {
  const gaps: TreatmentGap[] = [];
  const GAP_THRESHOLD_DAYS = 30;

  for (let i = 1; i < events.length; i++) {
    const prevDate = events[i - 1].dateOfService;
    const currDate = events[i].dateOfService;
    const daysDiff = Math.ceil(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff > GAP_THRESHOLD_DAYS) {
      gaps.push({
        startDate: prevDate.toISOString().split('T')[0],
        endDate: currDate.toISOString().split('T')[0],
        durationDays: daysDiff,
      });
    }
  }

  return gaps;
}

async function generateGapExplanations(
  gaps: TreatmentGap[],
  events: MedicalEvent[],
  caseData: { clientFirstName: string; clientLastName: string }
): Promise<TreatmentGap[]> {
  if (gaps.length === 0) return gaps;

  const prompt = `You are a personal injury attorney's assistant. Generate reasonable explanations for treatment gaps that can be used defensively in a demand letter.

Client: ${caseData.clientFirstName} ${caseData.clientLastName}

Treatment gaps found:
${gaps.map((g, i) => `${i + 1}. ${g.startDate} to ${g.endDate} (${g.durationDays} days)`).join('\n')}

For each gap, provide:
1. A reasonable explanation (financial constraints, work obligations, symptom improvement followed by flare-up, etc.)
2. Impact assessment (how this might affect the case)

Return JSON array:
[
  {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "durationDays": number,
    "explanation": "Reasonable explanation for the gap",
    "impact": "low|medium|high - brief impact assessment"
  }
]

Be realistic but frame explanations favorably for the plaintiff when possible.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      let text = content.text.trim();
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);
      return JSON.parse(text.trim());
    }
  } catch (error) {
    logger.error('Error generating gap explanations:', error);
  }

  return gaps;
}

function extractPainScoreHistory(events: MedicalEvent[]): PainScoreEntry[] {
  const painHistory: PainScoreEntry[] = [];

  for (const event of events) {
    const vitalSigns = event.vitalSigns as { pain_score?: number; pain_location?: string } | null;
    if (vitalSigns?.pain_score !== undefined && vitalSigns.pain_score !== null) {
      painHistory.push({
        date: event.dateOfService.toISOString().split('T')[0],
        score: vitalSigns.pain_score,
        provider: event.providerName || undefined,
        notes: vitalSigns.pain_location || undefined,
      });
    }
  }

  return painHistory;
}

function generateProviderSummary(events: MedicalEvent[]): ProviderSummary[] {
  const providerMap = new Map<string, ProviderSummary>();

  for (const event of events) {
    const name = event.providerName || event.facilityName || 'Unknown Provider';
    const key = name.toLowerCase();

    if (providerMap.has(key)) {
      const existing = providerMap.get(key)!;
      existing.visitCount++;
      existing.totalCost += event.totalCharge ? Number(event.totalCharge) : 0;
    } else {
      providerMap.set(key, {
        name,
        type: event.providerType || 'Unknown',
        visitCount: 1,
        totalCost: event.totalCharge ? Number(event.totalCharge) : 0,
      });
    }
  }

  return Array.from(providerMap.values()).sort((a, b) => b.visitCount - a.visitCount);
}

function generateDiagnosisSummary(events: MedicalEvent[]): DiagnosisSummary[] {
  const diagnosisMap = new Map<string, DiagnosisSummary>();

  for (const event of events) {
    const diagnoses = event.diagnoses as Array<{ diagnosis_name: string; icd_code?: string; body_part?: string }> | null;
    if (!diagnoses) continue;

    for (const dx of diagnoses) {
      const key = dx.diagnosis_name.toLowerCase();
      const dateStr = event.dateOfService.toISOString().split('T')[0];

      if (diagnosisMap.has(key)) {
        const existing = diagnosisMap.get(key)!;
        existing.mentionCount++;
        if (dateStr < existing.firstDate) existing.firstDate = dateStr;
        if (dateStr > existing.lastDate) existing.lastDate = dateStr;
      } else {
        diagnosisMap.set(key, {
          diagnosis: dx.diagnosis_name,
          icdCode: dx.icd_code,
          bodyPart: dx.body_part,
          firstDate: dateStr,
          lastDate: dateStr,
          mentionCount: 1,
        });
      }
    }
  }

  return Array.from(diagnosisMap.values()).sort((a, b) => b.mentionCount - a.mentionCount);
}

function generateBodyPartsSummary(events: MedicalEvent[]): BodyPartSummary[] {
  const bodyPartMap = new Map<string, BodyPartSummary>();

  for (const event of events) {
    const diagnoses = event.diagnoses as Array<{ diagnosis_name: string; body_part?: string }> | null;
    const treatments = event.treatmentsProcedures as string[] | null;

    if (diagnoses) {
      for (const dx of diagnoses) {
        if (!dx.body_part) continue;
        const key = dx.body_part.toLowerCase();

        if (bodyPartMap.has(key)) {
          const existing = bodyPartMap.get(key)!;
          if (!existing.diagnoses.includes(dx.diagnosis_name)) {
            existing.diagnoses.push(dx.diagnosis_name);
          }
        } else {
          bodyPartMap.set(key, {
            bodyPart: dx.body_part,
            diagnoses: [dx.diagnosis_name],
            treatments: [],
          });
        }
      }
    }

    // Add treatments to relevant body parts
    if (treatments) {
      for (const [key, summary] of bodyPartMap) {
        for (const treatment of treatments) {
          if (treatment.toLowerCase().includes(key) && !summary.treatments.includes(treatment)) {
            summary.treatments.push(treatment);
          }
        }
      }
    }
  }

  return Array.from(bodyPartMap.values());
}

function detectMMI(events: MedicalEvent[]): { mmiDate?: Date; mmiNotes?: string; mmiReached: boolean } {
  // Look for MMI keywords in prognosis or notes
  const mmiKeywords = ['maximum medical improvement', 'mmi', 'permanent and stationary', 'p&s'];

  for (const event of events.slice().reverse()) { // Check most recent first
    const textToCheck = [
      event.prognosis,
      event.permanencyStatements,
      event.assessment,
      event.plan,
    ].filter(Boolean).join(' ').toLowerCase();

    for (const keyword of mmiKeywords) {
      if (textToCheck.includes(keyword)) {
        return {
          mmiDate: event.dateOfService,
          mmiNotes: event.prognosis || event.permanencyStatements || undefined,
          mmiReached: true,
        };
      }
    }
  }

  return { mmiReached: false };
}

async function generateChronologyNarrative(
  events: MedicalEvent[],
  caseData: { clientFirstName: string; clientLastName: string; incidentDate: Date; incidentType: string; incidentDescription?: string | null },
  stats: { treatmentDurationDays: number; totalVisits: number; totalMedicalCosts: number; treatmentGaps: TreatmentGap[]; providersSummary: ProviderSummary[]; diagnosisSummary: DiagnosisSummary[] }
): Promise<string> {
  const prompt = `Generate a compelling medical treatment narrative for a personal injury demand letter.

## Case Information
- Client: ${caseData.clientFirstName} ${caseData.clientLastName}
- Incident Date: ${caseData.incidentDate.toISOString().split('T')[0]}
- Incident Type: ${caseData.incidentType}
- Description: ${caseData.incidentDescription || 'Not provided'}

## Treatment Summary
- Duration: ${stats.treatmentDurationDays} days
- Total Visits: ${stats.totalVisits}
- Total Medical Costs: $${stats.totalMedicalCosts.toLocaleString()}

## Diagnoses
${stats.diagnosisSummary.slice(0, 10).map(d => `- ${d.diagnosis}${d.icdCode ? ` (${d.icdCode})` : ''}`).join('\n')}

## Providers
${stats.providersSummary.slice(0, 8).map(p => `- ${p.name} (${p.type}): ${p.visitCount} visits, $${p.totalCost.toLocaleString()}`).join('\n')}

## Treatment Gaps
${stats.treatmentGaps.length > 0 ? stats.treatmentGaps.map(g => `- ${g.startDate} to ${g.endDate} (${g.durationDays} days): ${g.explanation || 'No explanation'}`).join('\n') : 'No significant treatment gaps'}

## Medical Events (Chronological)
${events.slice(0, 30).map(e => {
  const diagnoses = e.diagnoses as Array<{ diagnosis_name: string }> | null;
  const vitalSigns = e.vitalSigns as { pain_score?: number } | null;
  return `- ${e.dateOfService.toISOString().split('T')[0]}: ${e.providerName || e.facilityName || 'Provider'} (${e.providerType || 'Visit'})
  Chief Complaint: ${e.chiefComplaint || 'Not documented'}
  Diagnoses: ${diagnoses?.map(d => d.diagnosis_name).join(', ') || 'None documented'}
  Pain Score: ${vitalSigns?.pain_score !== undefined ? `${vitalSigns.pain_score}/10` : 'Not recorded'}
  ${e.objectiveFindings ? `Findings: ${e.objectiveFindings.substring(0, 200)}...` : ''}`;
}).join('\n\n')}

## Instructions
Write a compelling, chronological medical treatment narrative that:
1. Opens with the immediate response to the injury
2. Documents the progression of treatment
3. Emphasizes pain levels and functional limitations
4. Highlights objective medical findings
5. Addresses any treatment gaps with the provided explanations
6. Uses specific dates and provider names
7. Is written in professional legal style
8. Includes key diagnoses with ICD codes
9. Summarizes total costs

Output ONLY the narrative text in markdown format. No JSON, no additional commentary.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }
  } catch (error) {
    logger.error('Error generating chronology narrative:', error);
  }

  return 'Chronology narrative generation failed. Please regenerate.';
}

async function generateExecutiveSummary(
  events: MedicalEvent[],
  caseData: { clientFirstName: string; clientLastName: string; incidentDate: Date; incidentType: string },
  stats: { treatmentDurationDays: number; totalVisits: number; totalMedicalCosts: number; diagnosisSummary: DiagnosisSummary[] }
): Promise<string> {
  const prompt = `Generate a brief executive summary (3-4 paragraphs) for this personal injury case.

Client: ${caseData.clientFirstName} ${caseData.clientLastName}
Incident: ${caseData.incidentType} on ${caseData.incidentDate.toISOString().split('T')[0]}
Treatment Duration: ${stats.treatmentDurationDays} days
Total Visits: ${stats.totalVisits}
Total Medical Costs: $${stats.totalMedicalCosts.toLocaleString()}

Key Diagnoses:
${stats.diagnosisSummary.slice(0, 5).map(d => `- ${d.diagnosis}${d.icdCode ? ` (${d.icdCode})` : ''}`).join('\n')}

Write a concise executive summary highlighting:
1. Nature of the incident and immediate injuries
2. Scope of medical treatment required
3. Current status and prognosis
4. Total damages incurred

Output ONLY the summary text. No headers, no JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }
  } catch (error) {
    logger.error('Error generating executive summary:', error);
  }

  return 'Executive summary generation failed.';
}
