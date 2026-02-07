'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Document, DocumentCategory } from '@/types';

interface DocumentsResponse {
  documents: Document[];
  total: number;
}

export function useDocuments(caseId: string) {
  return useQuery({
    queryKey: ['documents', caseId],
    queryFn: async (): Promise<DocumentsResponse> => {
      const response = await api.get<Document[]>(`/documents/${caseId}`);
      const documents = Array.isArray(response.data) ? response.data : [];
      return {
        documents,
        total: documents.length,
      };
    },
    refetchInterval: (query) => {
      // Poll every 5 seconds if any document is still processing
      const data = query.state.data;
      if (data?.documents?.some((doc) =>
        ['PENDING', 'EXTRACTING_TEXT', 'CLASSIFYING', 'EXTRACTING_DATA'].includes(doc.processingStatus)
      )) {
        return 5000;
      }
      return false;
    },
    enabled: !!caseId,
  });
}

export function useDocument(caseId: string, documentId: string) {
  return useQuery({
    queryKey: ['document', caseId, documentId],
    queryFn: async (): Promise<Document> => {
      const response = await api.get<Document>(`/documents/${caseId}/${documentId}`);
      return response.data;
    },
    enabled: !!caseId && !!documentId,
  });
}

export function useDeleteDocument(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      await api.delete(`/documents/${caseId}/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
  });
}

export function useReprocessDocument(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.post(`/documents/${caseId}/process`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', caseId] });
    },
  });
}

export function useUpdateDocumentCategory(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      category,
    }: {
      documentId: string;
      category: DocumentCategory;
    }) => {
      const response = await api.put(`/documents/${caseId}/${documentId}`, {
        category,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', caseId] });
    },
  });
}

// Group documents by category
export function groupDocumentsByCategory(documents: Document[]): Map<DocumentCategory, Document[]> {
  const grouped = new Map<DocumentCategory, Document[]>();

  documents.forEach((doc) => {
    const existing = grouped.get(doc.category) || [];
    grouped.set(doc.category, [...existing, doc]);
  });

  return grouped;
}

// Get category display name
export function getCategoryDisplayName(category: DocumentCategory): string {
  const names: Record<DocumentCategory, string> = {
    MEDICAL_RECORDS: 'Medical Records',
    MEDICAL_BILLS: 'Medical Bills',
    POLICE_REPORT: 'Police Reports',
    PHOTOS: 'Photos & Evidence',
    WAGE_DOCUMENTATION: 'Wage Documentation',
    INSURANCE_CORRESPONDENCE: 'Insurance Correspondence',
    WITNESS_STATEMENT: 'Witness Statements',
    EXPERT_REPORT: 'Expert Reports',
    PRIOR_MEDICAL_RECORDS: 'Prior Medical Records',
    LIEN_LETTER: 'Lien Letters',
    OTHER: 'Other Documents',
  };
  return names[category] || category;
}

// Get processing status display
export function getProcessingStatusDisplay(status: string): {
  label: string;
  color: 'default' | 'success' | 'warning' | 'destructive';
} {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', color: 'default' };
    case 'EXTRACTING_TEXT':
      return { label: 'Extracting Text', color: 'warning' };
    case 'CLASSIFYING':
      return { label: 'Classifying', color: 'warning' };
    case 'EXTRACTING_DATA':
      return { label: 'Extracting Data', color: 'warning' };
    case 'COMPLETED':
      return { label: 'Completed', color: 'success' };
    case 'FAILED':
      return { label: 'Failed', color: 'destructive' };
    default:
      return { label: status, color: 'default' };
  }
}
