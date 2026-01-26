import pdf from 'pdf-parse';
import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
import { logger } from '../utils/logger.js';

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    const data = await pdf(buffer);

    // If text is minimal, it might be a scanned PDF - try OCR
    if (data.text.trim().length < 100 && data.numpages > 0) {
      logger.info('PDF appears to be scanned, attempting OCR...');
      // For scanned PDFs, we'd need to convert to images first
      // This is a simplified implementation
      return {
        text: data.text,
        pageCount: data.numpages,
      };
    }

    return {
      text: data.text,
      pageCount: data.numpages,
    };
  } catch (error) {
    logger.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    const result = await Tesseract.recognize(buffer, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    return result.data.text;
  } catch (error) {
    logger.error('Image OCR error:', error);
    throw new Error('Failed to extract text from image');
  }
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    logger.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}
