// Case types
export interface Case {
  id: string;
  caseNumber?: string;
  status: CaseStatus;
  clientFirstName: string;
  clientLastName: string;
  clientDateOfBirth?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  incidentDate: string;
  incidentLocation?: string;
  incidentDescription?: string;
  incidentType: string;
  defendantName?: string;
  defendantInsuranceCompany?: string;
  claimNumber?: string;
  jurisdiction: string;
  extractedData?: unknown;
  treatmentTimeline?: unknown;
  damagesCalculation?: unknown;
  attorneyWarnings?: unknown;
  createdAt: string;
  updatedAt: string;
  _count?: {
    documents: number;
    generatedDocuments: number;
  };
}

export type CaseStatus =
  | 'INTAKE'
  | 'DOCUMENTS_UPLOADED'
  | 'PROCESSING'
  | 'EXTRACTION_COMPLETE'
  | 'DRAFT_READY'
  | 'UNDER_REVIEW'
  | 'SENT'
  | 'SETTLED'
  | 'LITIGATION'
  | 'CLOSED';

// Document types
export interface Document {
  id: string;
  caseId: string;
  filename: string;
  originalFilename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  pageCount?: number;
  category: DocumentCategory;
  subcategory?: string;
  processingStatus: ProcessingStatus;
  processingError?: string;
  extractedText?: string;
  extractedData?: unknown;
  documentDate?: string;
  providerName?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentCategory =
  | 'MEDICAL_RECORDS'
  | 'MEDICAL_BILLS'
  | 'POLICE_REPORT'
  | 'PHOTOS'
  | 'WAGE_DOCUMENTATION'
  | 'INSURANCE_CORRESPONDENCE'
  | 'WITNESS_STATEMENT'
  | 'EXPERT_REPORT'
  | 'PRIOR_MEDICAL_RECORDS'
  | 'LIEN_LETTER'
  | 'OTHER';

export type ProcessingStatus =
  | 'PENDING'
  | 'EXTRACTING_TEXT'
  | 'CLASSIFYING'
  | 'EXTRACTING_DATA'
  | 'COMPLETED'
  | 'FAILED';

// Generated Document types
export interface GeneratedDocument {
  id: string;
  caseId: string;
  documentType: GeneratedDocType;
  version: number;
  tone: string;
  parameters?: unknown;
  content: string;
  contentHtml?: string;
  warnings?: Warning[];
  createdById: string;
  createdAt: string;
}

export type GeneratedDocType =
  | 'DEMAND_LETTER'
  | 'EXECUTIVE_SUMMARY'
  | 'GAP_ANALYSIS'
  | 'TREATMENT_TIMELINE'
  | 'DAMAGES_WORKSHEET';

export interface Warning {
  severity: 'critical' | 'moderate' | 'minor';
  category: string;
  message: string;
  recommendation: string;
}

// Firm types
export interface Firm {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  letterheadHtml?: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// User types
export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: UserRole;
  firmId: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'ATTORNEY' | 'PARALEGAL' | 'VIEWER';
