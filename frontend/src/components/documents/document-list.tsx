'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Document, DocumentCategory } from '@/types';
import { DocumentCard, DocumentCardSkeleton } from './document-card';
import { EmptyState } from '@/components/ui/empty-state';
import { groupDocumentsByCategory, getCategoryDisplayName } from '@/hooks/use-documents';
import {
  FileText,
  Receipt,
  FileWarning,
  Camera,
  Wallet,
  Mail,
  Users,
  ClipboardCheck,
  FolderOpen,
  FileQuestion,
  Link,
} from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  isLoading?: boolean;
  onPreview?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onReprocess?: (document: Document) => void;
  className?: string;
}

const categoryIcons: Record<DocumentCategory, React.ReactNode> = {
  MEDICAL_RECORDS: <FileText className="h-4 w-4" />,
  MEDICAL_BILLS: <Receipt className="h-4 w-4" />,
  POLICE_REPORT: <FileWarning className="h-4 w-4" />,
  PHOTOS: <Camera className="h-4 w-4" />,
  WAGE_DOCUMENTATION: <Wallet className="h-4 w-4" />,
  INSURANCE_CORRESPONDENCE: <Mail className="h-4 w-4" />,
  WITNESS_STATEMENT: <Users className="h-4 w-4" />,
  EXPERT_REPORT: <ClipboardCheck className="h-4 w-4" />,
  PRIOR_MEDICAL_RECORDS: <FolderOpen className="h-4 w-4" />,
  LIEN_LETTER: <Link className="h-4 w-4" />,
  OTHER: <FileQuestion className="h-4 w-4" />,
};

// Order categories for display
const categoryOrder: DocumentCategory[] = [
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

export function DocumentList({
  documents,
  isLoading,
  onPreview,
  onDownload,
  onDelete,
  onReprocess,
  className,
}: DocumentListProps) {
  const groupedDocuments = useMemo(
    () => groupDocumentsByCategory(documents),
    [documents]
  );

  if (isLoading) {
    return (
      <div className={cn('space-y-8', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((j) => (
                <DocumentCardSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No documents uploaded"
        description="Upload medical records, bills, photos, and other case documents to get started."
      />
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {categoryOrder
        .filter((category) => groupedDocuments.has(category))
        .map((category) => {
          const docs = groupedDocuments.get(category) || [];
          return (
            <div key={category} className="animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  {categoryIcons[category]}
                </div>
                <h3 className="font-semibold">
                  {getCategoryDisplayName(category)}
                </h3>
                <span className="text-sm text-muted-foreground">
                  ({docs.length})
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onPreview={() => onPreview?.(doc)}
                    onDownload={() => onDownload?.(doc)}
                    onDelete={() => onDelete?.(doc)}
                    onReprocess={() => onReprocess?.(doc)}
                  />
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}

// Flat list version (no grouping)
export function DocumentListFlat({
  documents,
  isLoading,
  onPreview,
  onDownload,
  onDelete,
  onReprocess,
  className,
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <DocumentCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No documents"
        description="No documents match your current filters."
        size="sm"
      />
    );
  }

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onPreview={() => onPreview?.(doc)}
          onDownload={() => onDownload?.(doc)}
          onDelete={() => onDelete?.(doc)}
          onReprocess={() => onReprocess?.(doc)}
        />
      ))}
    </div>
  );
}
