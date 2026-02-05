import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../db/client';
import { Document, MedicalEvent } from '@prisma/client';
import { logger } from '../utils/logger';

const anthropic = new Anthropic();

// Medical extraction prompt for 20+ fields
const MEDICAL_EXTRACTION_PROMPT = `You are an expert medical record analyst for personal injury law firms. Extract structured information with extreme accuracy.

## EXTRACTION REQUIREMENTS

Extract ALL fields below. Use null for missing data. Never guess or hallucinate.

## Output Schema (return as JSON array - one object per visit/encounter found):

[
  {
    "date_of_service": "YYYY-MM-DD",
    "provider_name": "Dr. Name, Credentials",
    "provider_type": "Emergency Room|Primary Care|Specialist|Physical Therapy|Chiropractor|Imaging Center|Hospital|Urgent Care|Surgery Center|Other",
    "facility_name": "Hospital/Clinic Name",
    "document_type": "Emergency Room Note|Progress Note|Operative Report|Imaging Report|Discharge Summary|Physical Therapy Note|Consultation|Lab Results|Other",

    "chief_complaint": "Patient's primary complaint in their words",

    "diagnoses": [
      {
        "diagnosis_name": "Plain language diagnosis",
        "icd_code": "S13.4XXA or null",
        "body_part": "Neck|Back|Head|Shoulder|Knee|etc"
      }
    ],

    "treatments_procedures": ["List of all treatments performed"],

    "medications": [
      {
        "medication_name": "Drug name",
        "dosage": "Amount",
        "frequency": "How often",
        "purpose": "What it's for"
      }
    ],

    "imaging_tests": [
      {
        "test_type": "X-ray|MRI|CT|EMG|Ultrasound|Lab",
        "body_part": "Area examined",
        "findings": "What was found",
        "impression": "Radiologist conclusion"
      }
    ],

    "vital_signs": {
      "blood_pressure": "120/80 or null",
      "heart_rate": "72 or null",
      "temperature": "98.6 or null",
      "pain_score": "8 or null (just the number)",
      "pain_location": "Where pain is reported"
    },

    "subjective_findings": "What patient reports - symptoms, pain descriptions",
    "objective_findings": "Doctor's observations - exam findings, measurements",
    "assessment": "Doctor's medical assessment",
    "plan": "Treatment plan, follow-up, referrals",

    "work_status": "Full Duty|Light Duty|Off Work|Modified Duty|Not Mentioned",
    "work_restrictions": "Specific restrictions if mentioned",

    "functional_limitations": [
      "Cannot lift > 10 lbs",
      "Difficulty sitting > 30 min"
    ],

    "prognosis": "Expected outcome statement",
    "permanency_statements": "Any permanent injury mentions",
    "future_treatment_recommended": ["List of recommended future care"],

    "pre_existing_mentioned": [
      {
        "condition": "What condition",
        "context": "How mentioned",
        "relevance": "Relation to current injury"
      }
    ],

    "costs": {
      "total_charge": 0.00,
      "insurance_paid": 0.00,
      "patient_responsibility": 0.00
    },

    "key_quotes": ["Important quotes supporting injury claim"],
    "red_flags": ["Statements that could weaken case"],
    "causation_statements": ["Statements linking condition to accident"]
  }
]

## CRITICAL RULES:
1. Dates are sacred - double-check every date, use YYYY-MM-DD format
2. Never hallucinate - if not in document, use null
3. Expand abbreviations - "Pt" → "Patient", "c/o" → "complains of"
4. Fix obvious OCR errors using context
5. Preserve medical terminology AND add plain language
6. Flag ALL pre-existing condition mentions
7. Capture ALL pain scores - critical for demand letters
8. Note ALL work status mentions - important for lost wages
9. Each visit/encounter should be a separate object in the array
10. If this is a bill, extract dates and costs but clinical fields can be null

## OUTPUT: Valid JSON array only. No markdown, no explanation, no code blocks.`;

export interface ExtractedMedicalEvent {
  date_of_service: string;
  provider_name?: string;
  provider_type?: string;
  facility_name?: string;
  document_type?: string;
  chief_complaint?: string;
  diagnoses?: Array<{ diagnosis_name: string; icd_code?: string; body_part?: string }>;
  treatments_procedures?: string[];
  medications?: Array<{ medication_name: string; dosage?: string; frequency?: string; purpose?: string }>;
  imaging_tests?: Array<{ test_type: string; body_part?: string; findings?: string; impression?: string }>;
  vital_signs?: { blood_pressure?: string; heart_rate?: string; temperature?: string; pain_score?: number; pain_location?: string };
  subjective_findings?: string;
  objective_findings?: string;
  assessment?: string;
  plan?: string;
  work_status?: string;
  work_restrictions?: string;
  functional_limitations?: string[];
  prognosis?: string;
  permanency_statements?: string;
  future_treatment_recommended?: string[];
  pre_existing_mentioned?: Array<{ condition: string; context?: string; relevance?: string }>;
  costs?: { total_charge?: number; insurance_paid?: number; patient_responsibility?: number };
  key_quotes?: string[];
  red_flags?: string[];
  causation_statements?: string[];
}

/**
 * Extract medical events from a document using Claude
 */
export async function extractMedicalEvents(
  document: Document,
  extractedText: string
): Promise<ExtractedMedicalEvent[]> {
  logger.info(`Extracting medical events from document ${document.id}`);

  // Chunk large documents (roughly 50 pages worth of text)
  const MAX_CHUNK_SIZE = 100000; // ~50 pages
  const chunks = chunkText(extractedText, MAX_CHUNK_SIZE);

  const allEvents: ExtractedMedicalEvent[] = [];

  for (let i = 0; i < chunks.length; i++) {
    logger.info(`Processing chunk ${i + 1}/${chunks.length} for document ${document.id}`);

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: `${MEDICAL_EXTRACTION_PROMPT}\n\n## DOCUMENT TEXT (Chunk ${i + 1}/${chunks.length}):\n\n${chunks[i]}`
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const events = parseExtractionResponse(content.text);
        allEvents.push(...events);
      }
    } catch (error) {
      logger.error(`Error extracting from chunk ${i + 1}:`, error);
      // Continue with other chunks
    }
  }

  // Deduplicate events by date and provider
  const dedupedEvents = deduplicateEvents(allEvents);

  logger.info(`Extracted ${dedupedEvents.length} medical events from document ${document.id}`);
  return dedupedEvents;
}

/**
 * Save extracted medical events to the database
 */
export async function saveMedicalEvents(
  caseId: string,
  documentId: string,
  events: ExtractedMedicalEvent[]
): Promise<MedicalEvent[]> {
  const savedEvents: MedicalEvent[] = [];

  for (const event of events) {
    try {
      const savedEvent = await prisma.medicalEvent.create({
        data: {
          caseId,
          documentId,
          dateOfService: new Date(event.date_of_service),
          providerName: event.provider_name,
          providerType: event.provider_type,
          facilityName: event.facility_name,
          documentType: event.document_type,
          chiefComplaint: event.chief_complaint,
          diagnoses: event.diagnoses || [],
          treatmentsProcedures: event.treatments_procedures || [],
          medications: event.medications || [],
          imagingTests: event.imaging_tests || [],
          vitalSigns: event.vital_signs || {},
          subjectiveFindings: event.subjective_findings,
          objectiveFindings: event.objective_findings,
          assessment: event.assessment,
          plan: event.plan,
          workStatus: event.work_status,
          workRestrictions: event.work_restrictions,
          functionalLimitations: event.functional_limitations || [],
          prognosis: event.prognosis,
          permanencyStatements: event.permanency_statements,
          futureTreatment: event.future_treatment_recommended || [],
          preExistingMentions: event.pre_existing_mentioned || [],
          keyQuotes: event.key_quotes || [],
          redFlags: event.red_flags || [],
          causationStatements: event.causation_statements || [],
          totalCharge: event.costs?.total_charge,
          insurancePaid: event.costs?.insurance_paid,
          patientResponsibility: event.costs?.patient_responsibility,
        }
      });
      savedEvents.push(savedEvent);
    } catch (error) {
      logger.error(`Error saving medical event:`, error);
    }
  }

  return savedEvents;
}

/**
 * Get all medical events for a case
 */
export async function getMedicalEventsForCase(caseId: string): Promise<MedicalEvent[]> {
  return prisma.medicalEvent.findMany({
    where: { caseId },
    orderBy: { dateOfService: 'asc' },
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
}

/**
 * Update a medical event (for attorney corrections)
 */
export async function updateMedicalEvent(
  eventId: string,
  data: Partial<MedicalEvent>
): Promise<MedicalEvent> {
  return prisma.medicalEvent.update({
    where: { id: eventId },
    data
  });
}

/**
 * Delete a medical event
 */
export async function deleteMedicalEvent(eventId: string): Promise<void> {
  await prisma.medicalEvent.delete({
    where: { id: eventId }
  });
}

// Helper functions

function chunkText(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    let endPosition = Math.min(currentPosition + maxSize, text.length);

    // Try to break at a paragraph or sentence boundary
    if (endPosition < text.length) {
      const lastParagraph = text.lastIndexOf('\n\n', endPosition);
      const lastSentence = text.lastIndexOf('. ', endPosition);

      if (lastParagraph > currentPosition + maxSize * 0.7) {
        endPosition = lastParagraph;
      } else if (lastSentence > currentPosition + maxSize * 0.7) {
        endPosition = lastSentence + 1;
      }
    }

    chunks.push(text.slice(currentPosition, endPosition));
    currentPosition = endPosition;
  }

  return chunks;
}

function parseExtractionResponse(response: string): ExtractedMedicalEvent[] {
  try {
    // Clean up the response - remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);

    // Handle both array and single object responses
    if (Array.isArray(parsed)) {
      return parsed.filter(e => e.date_of_service);
    } else if (parsed.date_of_service) {
      return [parsed];
    }

    return [];
  } catch (error) {
    logger.error('Error parsing extraction response:', error);
    logger.debug('Raw response:', response);
    return [];
  }
}

function deduplicateEvents(events: ExtractedMedicalEvent[]): ExtractedMedicalEvent[] {
  const seen = new Map<string, ExtractedMedicalEvent>();

  for (const event of events) {
    const key = `${event.date_of_service}-${event.provider_name || 'unknown'}-${event.facility_name || 'unknown'}`;

    if (!seen.has(key)) {
      seen.set(key, event);
    } else {
      // Merge data from duplicate entries
      const existing = seen.get(key)!;
      seen.set(key, mergeEvents(existing, event));
    }
  }

  return Array.from(seen.values());
}

function mergeEvents(existing: ExtractedMedicalEvent, newEvent: ExtractedMedicalEvent): ExtractedMedicalEvent {
  return {
    ...existing,
    diagnoses: [...(existing.diagnoses || []), ...(newEvent.diagnoses || [])].filter((d, i, arr) =>
      arr.findIndex(x => x.diagnosis_name === d.diagnosis_name) === i
    ),
    treatments_procedures: [...new Set([...(existing.treatments_procedures || []), ...(newEvent.treatments_procedures || [])])],
    medications: [...(existing.medications || []), ...(newEvent.medications || [])].filter((m, i, arr) =>
      arr.findIndex(x => x.medication_name === m.medication_name) === i
    ),
    key_quotes: [...new Set([...(existing.key_quotes || []), ...(newEvent.key_quotes || [])])],
    red_flags: [...new Set([...(existing.red_flags || []), ...(newEvent.red_flags || [])])],
    causation_statements: [...new Set([...(existing.causation_statements || []), ...(newEvent.causation_statements || [])])],
    // Take non-null values from new event if existing is null
    chief_complaint: existing.chief_complaint || newEvent.chief_complaint,
    subjective_findings: existing.subjective_findings || newEvent.subjective_findings,
    objective_findings: existing.objective_findings || newEvent.objective_findings,
    assessment: existing.assessment || newEvent.assessment,
    plan: existing.plan || newEvent.plan,
    prognosis: existing.prognosis || newEvent.prognosis,
  };
}
