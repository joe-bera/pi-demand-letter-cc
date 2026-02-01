'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeader, PageHeaderSkeleton } from '@/components/layout/page-header';
import {
  UploadZone,
  CompactUploadZone,
  UploadProgress,
  DocumentList,
  ProcessingStatus,
  DocumentPreviewModal,
} from '@/components/documents';
import {
  useDocuments,
  useDeleteDocument,
  useReprocessDocument,
} from '@/hooks/use-documents';
import { useDocumentUpload } from '@/hooks/use-document-upload';
import { Case, Document } from '@/types';
import { ArrowRight, FileText, Sparkles } from 'lucide-react';

export default function DocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  // Fetch case data
  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const response = await api.get<Case>(`/cases/${caseId}`);
      return response.data;
    },
  });

  // Fetch documents
  const {
    data: documentsData,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = useDocuments(caseId);

  // Document mutations
  const deleteDocument = useDeleteDocument(caseId);
  const reprocessDocument = useReprocessDocument(caseId);

  // Upload state
  const {
    files: uploadFiles,
    isUploading,
    addFiles,
    startUpload,
    removeFile,
    retryFile,
    clearCompleted,
  } = useDocumentUpload({
    caseId,
    onSuccess: () => {
      refetchDocuments();
    },
    onError: (file, error) => {
      toast.error(`Failed to upload ${file.file.name}`, {
        description: error.message,
      });
    },
  });

  // Preview modal state
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const documents = documentsData?.documents || [];

  // Handle file drop
  const handleFilesAdded = useCallback(
    (files: File[]) => {
      addFiles(files);
      toast.success(`${files.length} file(s) added to upload queue`);
    },
    [addFiles]
  );

  // Start upload when files are added
  useEffect(() => {
    if (uploadFiles.length > 0 && !isUploading) {
      const pendingFiles = uploadFiles.filter((f) => f.status === 'pending');
      if (pendingFiles.length > 0) {
        startUpload();
      }
    }
  }, [uploadFiles, isUploading, startUpload]);

  // Document actions
  const handlePreview = useCallback(
    (doc: Document) => {
      const index = documents.findIndex((d) => d.id === doc.id);
      setPreviewIndex(index);
      setPreviewDocument(doc);
    },
    [documents]
  );

  const handleDownload = useCallback((doc: Document) => {
    window.open(doc.fileUrl, '_blank');
  }, []);

  const handleDelete = useCallback(
    async (doc: Document) => {
      try {
        await deleteDocument.mutateAsync(doc.id);
        toast.success('Document deleted');
      } catch {
        toast.error('Failed to delete document');
      }
    },
    [deleteDocument]
  );

  const handleReprocess = useCallback(
    async (doc: Document) => {
      try {
        await reprocessDocument.mutateAsync(doc.id);
        toast.success('Document queued for reprocessing');
      } catch {
        toast.error('Failed to reprocess document');
      }
    },
    [reprocessDocument]
  );

  // Preview navigation
  const handlePreviousPreview = useCallback(() => {
    if (previewIndex > 0) {
      const newIndex = previewIndex - 1;
      setPreviewIndex(newIndex);
      setPreviewDocument(documents[newIndex]);
    }
  }, [previewIndex, documents]);

  const handleNextPreview = useCallback(() => {
    if (previewIndex < documents.length - 1) {
      const newIndex = previewIndex + 1;
      setPreviewIndex(newIndex);
      setPreviewDocument(documents[newIndex]);
    }
  }, [previewIndex, documents]);

  // Check if ready to generate
  const completedDocuments = documents.filter(
    (d) => d.processingStatus === 'COMPLETED'
  );
  const hasMinimumDocuments = completedDocuments.length >= 1;
  const isAllProcessed = documents.every(
    (d) => d.processingStatus === 'COMPLETED' || d.processingStatus === 'FAILED'
  );

  if (caseLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton showActions />
        <div className="h-48 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  const clientName = caseData
    ? `${caseData.clientFirstName} ${caseData.clientLastName}`
    : 'Case';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description={`Upload and manage documents for ${clientName}`}
        breadcrumbItems={[
          { label: 'Cases', href: '/cases' },
          { label: clientName, href: `/cases/${caseId}` },
          { label: 'Documents' },
        ]}
        actions={
          hasMinimumDocuments && (
            <Button
              onClick={() => router.push(`/cases/${caseId}/generate`)}
              disabled={!isAllProcessed}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Letter
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )
        }
      />

      {/* Upload Zone */}
      {documents.length === 0 ? (
        <UploadZone
          onFilesAdded={handleFilesAdded}
          disabled={isUploading}
          className="min-h-[200px]"
        />
      ) : (
        <CompactUploadZone
          onFilesAdded={handleFilesAdded}
          disabled={isUploading}
        />
      )}

      {/* Upload Progress */}
      <UploadProgress
        files={uploadFiles}
        onRemove={removeFile}
        onRetry={retryFile}
        onClearCompleted={clearCompleted}
      />

      {/* Processing Status */}
      {documents.length > 0 && <ProcessingStatus documents={documents} />}

      {/* Document List */}
      <div className="space-y-4">
        {documents.length > 0 && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Uploaded Documents
              <span className="text-sm font-normal text-muted-foreground">
                ({documents.length})
              </span>
            </h2>
          </div>
        )}

        <DocumentList
          documents={documents}
          isLoading={documentsLoading}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onReprocess={handleReprocess}
        />
      </div>

      {/* Generate CTA when ready */}
      {hasMinimumDocuments && isAllProcessed && (
        <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-6 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-semibold">Ready to Generate</h3>
          <p className="text-muted-foreground mt-1 mb-4 max-w-md mx-auto">
            All documents have been processed. You can now generate a demand
            letter using the extracted data.
          </p>
          <Button onClick={() => router.push(`/cases/${caseId}/generate`)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Demand Letter
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      <DocumentPreviewModal
        document={previewDocument}
        open={!!previewDocument}
        onOpenChange={(open) => !open && setPreviewDocument(null)}
        onDownload={() => previewDocument && handleDownload(previewDocument)}
        onPrevious={handlePreviousPreview}
        onNext={handleNextPreview}
        hasPrevious={previewIndex > 0}
        hasNext={previewIndex < documents.length - 1}
      />
    </div>
  );
}
