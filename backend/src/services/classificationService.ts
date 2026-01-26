import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import { CLASSIFICATION_PROMPT } from '../prompts/classificationPrompt.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ClassificationResult {
  category: string;
  subcategory: string | null;
  confidence: number;
  documentDate: string | null;
  providerName: string | null;
}

export async function classifyDocument(text: string): Promise<ClassificationResult> {
  try {
    // Truncate text if too long (use first 10k chars for classification)
    const truncatedText = text.substring(0, 10000);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${CLASSIFICATION_PROMPT}\n\n---\n\nDocument text:\n${truncatedText}`,
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

    const result = JSON.parse(jsonMatch[0]) as ClassificationResult;

    // Validate category
    const validCategories = [
      'MEDICAL_RECORDS',
      'MEDICAL_BILLS',
      'POLICE_REPORT',
      'PHOTOS',
      'WAGE_DOCUMENTATION',
      'INSURANCE_CORRESPONDENCE',
      'WITNESS_STATEMENT',
      'EXPERT_REPORT',
      'PRIOR_MEDICAL_RECORDS',
      'LIEN_LETTER',
      'OTHER',
    ];

    if (!validCategories.includes(result.category)) {
      result.category = 'OTHER';
    }

    logger.info(`Document classified as: ${result.category} (${result.confidence})`);

    return result;
  } catch (error) {
    logger.error('Classification error:', error);
    // Return default classification on error
    return {
      category: 'OTHER',
      subcategory: null,
      confidence: 0,
      documentDate: null,
      providerName: null,
    };
  }
}
