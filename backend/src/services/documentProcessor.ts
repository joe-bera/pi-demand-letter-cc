import prisma from '../db/client.js';
import { getFileFromS3 } from './storage.js';
import { extractTextFromPdf, extractTextFromImage, extractTextFromDocx } from './textExtraction.js';
import { classifyDocument } from './classificationService.js';
import { extractStructuredData } from './extractionService.js';
import { extractMedicalEvents, saveMedicalEvents } from './medicalEventService.js';
import { generateChronology } from './chronologyService.js';
import { logger } from '../utils/logger.js';

export async function processDocument(documentId: string): Promise<void> {
  try {
    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    logger.info(`Processing document: ${document.originalFilename}`);

    // Update status to extracting
    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: 'EXTRACTING_TEXT' },
    });

    // Get file from S3
    const fileBuffer = await getFileFromS3(document.filename);

    // Extract text based on file type
    let extractedText = '';
    let pageCount = 0;

    if (document.mimeType === 'application/pdf') {
      const result = await extractTextFromPdf(fileBuffer);
      extractedText = result.text;
      pageCount = result.pageCount;
    } else if (document.mimeType.startsWith('image/')) {
      extractedText = await extractTextFromImage(fileBuffer);
      pageCount = 1;
    } else if (document.mimeType.includes('wordprocessingml')) {
      extractedText = await extractTextFromDocx(fileBuffer);
      pageCount = 1; // DOCX doesn't have clear page counts
    }

    // Update with extracted text
    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedText,
        pageCount,
        processingStatus: 'CLASSIFYING',
      },
    });

    // Classify document
    const classification = await classifyDocument(extractedText);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        category: classification.category,
        subcategory: classification.subcategory,
        documentDate: classification.documentDate ? new Date(classification.documentDate) : null,
        providerName: classification.providerName,
        processingStatus: 'EXTRACTING_DATA',
      },
    });

    // Extract structured data based on category
    const structuredData = await extractStructuredData(
      extractedText,
      classification.category
    );

    // For medical documents, also extract medical events
    if (classification.category === 'MEDICAL_RECORDS' || classification.category === 'MEDICAL_BILLS') {
      logger.info(`Extracting medical events from ${document.originalFilename}`);
      try {
        const medicalEvents = await extractMedicalEvents(document, extractedText);
        if (medicalEvents.length > 0) {
          await saveMedicalEvents(document.caseId, documentId, medicalEvents);
          logger.info(`Saved ${medicalEvents.length} medical events from ${document.originalFilename}`);
        }
      } catch (eventError) {
        logger.error(`Failed to extract medical events: ${eventError}`);
        // Continue processing - don't fail the whole document
      }
    }

    // Update with final data
    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedData: structuredData,
        processingStatus: 'COMPLETED',
      },
    });

    logger.info(`Document processed successfully: ${document.originalFilename}`);

    // Check if all documents for the case are processed
    const caseDocuments = await prisma.document.findMany({
      where: { caseId: document.caseId },
    });

    const allCompleted = caseDocuments.every(
      (doc) => doc.processingStatus === 'COMPLETED'
    );

    if (allCompleted) {
      // Synthesize all document data into case
      await synthesizeCaseData(document.caseId);

      // Generate medical chronology if there are medical events
      const eventCount = await prisma.medicalEvent.count({ where: { caseId: document.caseId } });
      if (eventCount > 0) {
        logger.info(`Generating chronology for case ${document.caseId}`);
        try {
          await generateChronology(document.caseId);
          logger.info(`Chronology generated for case ${document.caseId}`);
        } catch (chronoError) {
          logger.error(`Failed to generate chronology: ${chronoError}`);
        }
      }
    }
  } catch (error) {
    logger.error(`Document processing failed for ${documentId}:`, error);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        processingStatus: 'FAILED',
        processingError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

async function synthesizeCaseData(caseId: string): Promise<void> {
  const documents = await prisma.document.findMany({
    where: {
      caseId,
      processingStatus: 'COMPLETED',
    },
  });

  // Aggregate all extracted data
  const allData = documents
    .filter((doc) => doc.extractedData)
    .map((doc) => ({
      category: doc.category,
      data: doc.extractedData,
    }));

  // Build treatment timeline
  const treatmentTimeline = buildTreatmentTimeline(allData);

  // Calculate damages
  const damagesCalculation = calculateDamages(allData);

  // Update case with synthesized data
  await prisma.case.update({
    where: { id: caseId },
    data: {
      extractedData: { documents: allData },
      treatmentTimeline,
      damagesCalculation,
      status: 'EXTRACTION_COMPLETE',
    },
  });

  logger.info(`Case data synthesized: ${caseId}`);
}

function buildTreatmentTimeline(allData: { category: string; data: unknown }[]): unknown {
  const timeline: Array<{
    date: string;
    provider: string;
    type: string;
    description: string;
  }> = [];

  for (const item of allData) {
    if (item.category === 'MEDICAL_RECORDS' && item.data) {
      const data = item.data as Record<string, unknown>;
      const visits = (data.visits as Array<Record<string, unknown>>) || [];

      for (const visit of visits) {
        timeline.push({
          date: visit.date as string,
          provider: (visit.providerName as string) || 'Unknown',
          type: (visit.visitType as string) || 'Visit',
          description: (visit.chiefComplaint as string) || '',
        });
      }
    }
  }

  // Sort by date
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return timeline;
}

function calculateDamages(allData: { category: string; data: unknown }[]): unknown {
  let totalMedicalBills = 0;
  let totalWageLoss = 0;
  const itemizedCharges: Array<{
    provider: string;
    date: string;
    amount: number;
    description: string;
  }> = [];

  for (const item of allData) {
    if (item.category === 'MEDICAL_BILLS' && item.data) {
      const data = item.data as Record<string, unknown>;
      const charges = (data.charges as Array<Record<string, unknown>>) || [];

      for (const charge of charges) {
        const amount = (charge.amountBilled as number) || 0;
        totalMedicalBills += amount;
        itemizedCharges.push({
          provider: (data.provider as Record<string, string>)?.name || 'Unknown',
          date: charge.dateOfService as string,
          amount,
          description: charge.description as string,
        });
      }
    }

    if (item.category === 'WAGE_DOCUMENTATION' && item.data) {
      const data = item.data as Record<string, unknown>;
      totalWageLoss += (data.totalWageLoss as number) || 0;
    }
  }

  return {
    specialDamages: {
      medicalBills: totalMedicalBills,
      wageLoss: totalWageLoss,
      total: totalMedicalBills + totalWageLoss,
    },
    itemizedCharges,
  };
}
