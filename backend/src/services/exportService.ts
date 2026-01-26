import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import { logger } from '../utils/logger.js';

interface Firm {
  id: string;
  name: string;
  logoUrl: string | null;
  letterheadHtml: string | null;
  primaryColor: string;
}

export async function generateDocx(
  markdownContent: string,
  firm: Firm
): Promise<Buffer> {
  try {
    const paragraphs = parseMarkdownToParagraphs(markdownContent, firm);

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch in twips
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  } catch (error) {
    logger.error('DOCX generation error:', error);
    throw new Error('Failed to generate Word document');
  }
}

function parseMarkdownToParagraphs(markdown: string, firm: Firm): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = markdown.split('\n');

  // Add firm letterhead
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: firm.name,
          bold: true,
          size: 28,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: '' })],
      spacing: { after: 400 },
    })
  );

  for (const line of lines) {
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ children: [] }));
      continue;
    }

    // Handle headers
    if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
    } else if (line.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (line.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith('- ')) {
      // Bullet points
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line.substring(2) })],
          bullet: { level: 0 },
        })
      );
    } else if (line.startsWith('|')) {
      // Table rows (simplified - just convert to text)
      const cells = line.split('|').filter((c) => c.trim());
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: cells.join(' | ') })],
        })
      );
    } else {
      // Regular paragraph - handle bold and italic
      const runs = parseInlineFormatting(line);
      paragraphs.push(
        new Paragraph({
          children: runs,
          spacing: { after: 200 },
        })
      );
    }
  }

  return paragraphs;
}

function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let currentText = '';
  let isBold = false;
  let isItalic = false;

  for (let i = 0; i < text.length; i++) {
    // Check for bold (**text**)
    if (text.substring(i, i + 2) === '**') {
      if (currentText) {
        runs.push(new TextRun({ text: currentText, bold: isBold, italics: isItalic }));
        currentText = '';
      }
      isBold = !isBold;
      i++; // Skip second *
      continue;
    }

    // Check for italic (*text* or _text_)
    if ((text[i] === '*' || text[i] === '_') && text[i - 1] !== '\\') {
      if (currentText) {
        runs.push(new TextRun({ text: currentText, bold: isBold, italics: isItalic }));
        currentText = '';
      }
      isItalic = !isItalic;
      continue;
    }

    currentText += text[i];
  }

  if (currentText) {
    runs.push(new TextRun({ text: currentText, bold: isBold, italics: isItalic }));
  }

  return runs.length > 0 ? runs : [new TextRun({ text })];
}

export async function generatePdf(
  markdownContent: string,
  firm: Firm
): Promise<Buffer> {
  // For PDF generation, we'd typically use a library like puppeteer or pdf-lib
  // For now, return a placeholder that indicates PDF generation is not fully implemented
  logger.warn('PDF generation is not fully implemented - returning placeholder');

  // Create a simple text-based PDF using basic structure
  // In production, use puppeteer to render HTML to PDF
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(${firm.name} - Demand Letter) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000361 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
434
%%EOF`;

  return Buffer.from(pdfContent);
}
