import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import {
  MEDICAL_RECORDS_EXTRACTION_PROMPT,
  MEDICAL_BILLS_EXTRACTION_PROMPT,
  POLICE_REPORT_EXTRACTION_PROMPT,
  WAGE_DOCUMENTATION_EXTRACTION_PROMPT,
} from '../prompts/extractionPrompts.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CHUNK_SIZE = 50000; // ~12.5k tokens for Claude

export async function extractStructuredData(
  text: string,
  category: string
): Promise<unknown> {
  try {
    const prompt = getPromptForCategory(category);

    if (!prompt) {
      logger.info(`No extraction prompt for category: ${category}`);
      return { rawText: text.substring(0, 5000) };
    }

    // For large documents, process in chunks
    if (text.length > CHUNK_SIZE) {
      return await extractFromChunks(text, prompt, category);
    }

    return await extractSingleChunk(text, prompt);
  } catch (error) {
    logger.error('Extraction error:', error);
    return { error: 'Failed to extract structured data' };
  }
}

function getPromptForCategory(category: string): string | null {
  switch (category) {
    case 'MEDICAL_RECORDS':
      return MEDICAL_RECORDS_EXTRACTION_PROMPT;
    case 'MEDICAL_BILLS':
      return MEDICAL_BILLS_EXTRACTION_PROMPT;
    case 'POLICE_REPORT':
      return POLICE_REPORT_EXTRACTION_PROMPT;
    case 'WAGE_DOCUMENTATION':
      return WAGE_DOCUMENTATION_EXTRACTION_PROMPT;
    default:
      return null;
  }
}

async function extractSingleChunk(text: string, prompt: string): Promise<unknown> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `${prompt}\n\n---\n\nDocument text:\n${text}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  // Parse JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]);
}

async function extractFromChunks(
  text: string,
  prompt: string,
  category: string
): Promise<unknown> {
  const chunks: string[] = [];

  // Split text into chunks
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.substring(i, i + CHUNK_SIZE));
  }

  logger.info(`Processing ${chunks.length} chunks for ${category}`);

  // Process each chunk
  const results = await Promise.all(
    chunks.map((chunk, index) =>
      extractSingleChunk(chunk, `${prompt}\n\nNote: This is chunk ${index + 1} of ${chunks.length}.`)
    )
  );

  // Merge results based on category
  return mergeResults(results, category);
}

function mergeResults(results: unknown[], category: string): unknown {
  if (category === 'MEDICAL_RECORDS') {
    return mergeMedicalRecords(results);
  }
  if (category === 'MEDICAL_BILLS') {
    return mergeMedicalBills(results);
  }

  // Default: return first result
  return results[0];
}

function mergeMedicalRecords(results: unknown[]): unknown {
  const merged: {
    patient: unknown;
    visits: unknown[];
    imagingSummary: unknown[];
    preExistingConditions: string[];
    futureTreatmentRecommendations: string[];
  } = {
    patient: null,
    visits: [],
    imagingSummary: [],
    preExistingConditions: [],
    futureTreatmentRecommendations: [],
  };

  for (const result of results) {
    const data = result as Record<string, unknown>;

    if (data.patient && !merged.patient) {
      merged.patient = data.patient;
    }

    if (Array.isArray(data.visits)) {
      merged.visits.push(...data.visits);
    }

    if (Array.isArray(data.imagingSummary)) {
      merged.imagingSummary.push(...data.imagingSummary);
    }

    if (Array.isArray(data.preExistingConditions)) {
      merged.preExistingConditions.push(
        ...data.preExistingConditions.filter(
          (c: string) => !merged.preExistingConditions.includes(c)
        )
      );
    }

    if (Array.isArray(data.futureTreatmentRecommendations)) {
      merged.futureTreatmentRecommendations.push(
        ...data.futureTreatmentRecommendations.filter(
          (r: string) => !merged.futureTreatmentRecommendations.includes(r)
        )
      );
    }
  }

  // Sort visits by date
  merged.visits.sort((a: unknown, b: unknown) => {
    const dateA = (a as Record<string, string>).date || '';
    const dateB = (b as Record<string, string>).date || '';
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  return merged;
}

function mergeMedicalBills(results: unknown[]): unknown {
  const merged: {
    providers: unknown[];
    charges: unknown[];
    summary: {
      totalBilled: number;
      totalPaid: number;
      totalDue: number;
    };
  } = {
    providers: [],
    charges: [],
    summary: {
      totalBilled: 0,
      totalPaid: 0,
      totalDue: 0,
    },
  };

  for (const result of results) {
    const data = result as Record<string, unknown>;

    if (data.provider) {
      merged.providers.push(data.provider);
    }

    if (Array.isArray(data.charges)) {
      merged.charges.push(...data.charges);
    }

    if (data.summary) {
      const summary = data.summary as Record<string, number>;
      merged.summary.totalBilled += summary.totalBilled || 0;
      merged.summary.totalPaid += summary.totalPaid || 0;
      merged.summary.totalDue += summary.totalDue || 0;
    }
  }

  return merged;
}
