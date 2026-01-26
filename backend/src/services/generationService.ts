import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import { DEMAND_LETTER_SYSTEM_PROMPT } from '../prompts/systemPrompt.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GenerationResult {
  content: string;
  contentHtml: string | null;
  warnings: unknown;
}

interface CaseWithDocuments {
  id: string;
  clientFirstName: string;
  clientLastName: string;
  clientDateOfBirth: Date | null;
  clientAddress: string | null;
  incidentDate: Date;
  incidentLocation: string | null;
  incidentDescription: string | null;
  incidentType: string;
  defendantName: string | null;
  defendantInsuranceCompany: string | null;
  claimNumber: string | null;
  jurisdiction: string;
  extractedData: unknown;
  treatmentTimeline: unknown;
  damagesCalculation: unknown;
  documents: Array<{
    category: string;
    extractedData: unknown;
    extractedText: string | null;
  }>;
}

export async function generateDemandLetter(
  caseData: CaseWithDocuments,
  tone: string
): Promise<GenerationResult> {
  logger.info(`Generating demand letter for case ${caseData.id} with tone: ${tone}`);

  // Build context from case data
  const context = buildCaseContext(caseData);

  const userPrompt = `Generate a demand letter for the following case with ${tone} tone.

## Case Information
${context}

## Instructions
1. Generate a complete demand letter following the structure in your system prompt
2. Use all available information from the documents
3. Calculate and present damages clearly
4. Flag any warnings for attorney review
5. Use placeholders like [INSERT DATE] for any missing information

Return your response as JSON with the following structure:
{
  "demandLetter": "Full letter in Markdown format",
  "summary": {
    "clientName": "",
    "incidentDate": "",
    "totalSpecialDamages": 0,
    "demandAmount": 0,
    "keyInjuries": [],
    "liabilityStrength": "strong|moderate|weak"
  },
  "warnings": [
    {
      "severity": "critical|moderate|minor",
      "category": "treatment_gap|pre_existing|causation|credibility|missing_doc|statute",
      "message": "",
      "recommendation": ""
    }
  ],
  "missingInformation": []
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    system: DEMAND_LETTER_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
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
    // If no JSON, treat entire response as the letter
    return {
      content: content.text,
      contentHtml: null,
      warnings: [],
    };
  }

  const result = JSON.parse(jsonMatch[0]);

  return {
    content: result.demandLetter || content.text,
    contentHtml: null, // Can be converted to HTML later if needed
    warnings: result.warnings || [],
  };
}

export async function generateDocument(
  caseData: CaseWithDocuments,
  documentType: string,
  tone: string
): Promise<GenerationResult> {
  logger.info(`Generating ${documentType} for case ${caseData.id}`);

  const context = buildCaseContext(caseData);

  let prompt = '';
  switch (documentType) {
    case 'EXECUTIVE_SUMMARY':
      prompt = `Generate an executive summary for the following personal injury case.
Include: case overview, key facts, injuries sustained, treatment summary, liability analysis, damages breakdown, and recommended settlement range.`;
      break;

    case 'GAP_ANALYSIS':
      prompt = `Generate a gap analysis report for the following personal injury case.
Identify: missing documentation, treatment gaps, potential weaknesses, areas needing additional evidence, and recommendations for strengthening the case.`;
      break;

    case 'TREATMENT_TIMELINE':
      prompt = `Generate a detailed chronological treatment timeline for the following personal injury case.
Include: all medical visits, diagnoses, procedures, medications, and follow-up care in date order.`;
      break;

    case 'DAMAGES_WORKSHEET':
      prompt = `Generate a comprehensive damages worksheet for the following personal injury case.
Include: itemized special damages (medical bills, wage loss), calculation methodology, and pain and suffering analysis.`;
      break;

    default:
      throw new Error(`Unknown document type: ${documentType}`);
  }

  const userPrompt = `${prompt}

## Case Information
${context}

Generate a professional document suitable for attorney review. Use Markdown formatting.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const responseContent = response.content[0];
  if (responseContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return {
    content: responseContent.text,
    contentHtml: null,
    warnings: [],
  };
}

function buildCaseContext(caseData: CaseWithDocuments): string {
  const sections: string[] = [];

  // Client information
  sections.push(`### Client
- Name: ${caseData.clientFirstName} ${caseData.clientLastName}
- DOB: ${caseData.clientDateOfBirth?.toISOString().split('T')[0] || '[UNKNOWN]'}
- Address: ${caseData.clientAddress || '[UNKNOWN]'}`);

  // Incident information
  sections.push(`### Incident
- Date: ${caseData.incidentDate.toISOString().split('T')[0]}
- Type: ${caseData.incidentType}
- Location: ${caseData.incidentLocation || '[UNKNOWN]'}
- Description: ${caseData.incidentDescription || '[NOT PROVIDED]'}`);

  // Defendant information
  if (caseData.defendantName || caseData.defendantInsuranceCompany) {
    sections.push(`### Defendant/Insurance
- Defendant: ${caseData.defendantName || '[UNKNOWN]'}
- Insurance Company: ${caseData.defendantInsuranceCompany || '[UNKNOWN]'}
- Claim Number: ${caseData.claimNumber || '[UNKNOWN]'}`);
  }

  // Treatment timeline
  if (caseData.treatmentTimeline) {
    const timeline = caseData.treatmentTimeline as Array<{
      date: string;
      provider: string;
      type: string;
      description: string;
    }>;
    if (timeline.length > 0) {
      sections.push(`### Treatment Timeline
${timeline.map((t) => `- ${t.date}: ${t.provider} - ${t.type}${t.description ? ` (${t.description})` : ''}`).join('\n')}`);
    }
  }

  // Damages
  if (caseData.damagesCalculation) {
    const damages = caseData.damagesCalculation as {
      specialDamages?: {
        medicalBills?: number;
        wageLoss?: number;
        total?: number;
      };
    };
    if (damages.specialDamages) {
      sections.push(`### Damages Summary
- Medical Bills: $${damages.specialDamages.medicalBills?.toLocaleString() || 0}
- Wage Loss: $${damages.specialDamages.wageLoss?.toLocaleString() || 0}
- Total Special Damages: $${damages.specialDamages.total?.toLocaleString() || 0}`);
    }
  }

  // Document summaries
  const docsByCategory = new Map<string, unknown[]>();
  for (const doc of caseData.documents) {
    if (doc.extractedData) {
      const existing = docsByCategory.get(doc.category) || [];
      existing.push(doc.extractedData);
      docsByCategory.set(doc.category, existing);
    }
  }

  if (docsByCategory.size > 0) {
    sections.push(`### Extracted Document Data
${Array.from(docsByCategory.entries())
  .map(([category, data]) => `#### ${category}\n${JSON.stringify(data, null, 2)}`)
  .join('\n\n')}`);
  }

  return sections.join('\n\n');
}
