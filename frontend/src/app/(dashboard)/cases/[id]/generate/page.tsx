'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader, PageHeaderSkeleton } from '@/components/layout/page-header';
import {
  ToneSelector,
  DocumentTypeSelector,
  DataSummary,
  LetterPreview,
  WarningPanel,
  ExportPanel,
  VersionHistory,
} from '@/components/generation';
import { useGeneration, toneOptions } from '@/hooks/use-generation';
import { useDocuments } from '@/hooks/use-documents';
import { Case, GeneratedDocType, GeneratedDocument } from '@/types';
import {
  Sparkles,
  Loader2,
  StopCircle,
  ArrowLeft,
  RefreshCw,
  FileText,
} from 'lucide-react';

export default function GeneratePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  // Generation state
  const [selectedType, setSelectedType] = useState<GeneratedDocType>('DEMAND_LETTER');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [selectedVersion, setSelectedVersion] = useState<GeneratedDocument | null>(null);

  // Fetch case data
  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const response = await api.get<Case>(`/cases/${caseId}`);
      return response.data;
    },
  });

  // Fetch documents
  const { data: documentsData } = useDocuments(caseId);
  const documents = documentsData?.documents || [];

  // Generation hook
  const {
    content,
    isGenerating,
    isStreaming,
    warnings,
    error,
    generatedDocuments,
    generate,
    cancel,
    reset,
    getLatestVersion,
  } = useGeneration(caseId);

  // Display content (from streaming or selected version)
  const displayContent = selectedVersion?.content || content;
  const displayWarnings = selectedVersion?.warnings || warnings;

  // Handle generate
  const handleGenerate = useCallback(async () => {
    setSelectedVersion(null);
    await generate({
      documentType: selectedType,
      tone: selectedTone,
    });
  }, [selectedType, selectedTone, generate]);

  // Handle version select
  const handleVersionSelect = useCallback((doc: GeneratedDocument) => {
    setSelectedVersion(doc);
  }, []);

  // Check document readiness
  const completedDocs = documents.filter((d) => d.processingStatus === 'COMPLETED');
  const hasRequiredDocs = completedDocs.length >= 1;

  if (caseLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton showActions />
      </div>
    );
  }

  const clientName = caseData
    ? `${caseData.clientFirstName} ${caseData.clientLastName}`
    : 'Case';

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Generate Document"
        description={`Create AI-powered documents for ${clientName}`}
        breadcrumbItems={[
          { label: 'Cases', href: '/cases' },
          { label: clientName, href: `/cases/${caseId}` },
          { label: 'Generate' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.push(`/cases/${caseId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Case
          </Button>
        }
      />

      {/* Warning if not enough documents */}
      {!hasRequiredDocs && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="flex items-center gap-4 py-4">
            <FileText className="h-8 w-8 text-warning" />
            <div className="flex-1">
              <p className="font-medium">No processed documents</p>
              <p className="text-sm text-muted-foreground">
                Upload and process documents before generating a demand letter.
              </p>
            </div>
            <Button onClick={() => router.push(`/cases/${caseId}/documents`)}>
              Upload Documents
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Two Panel Layout */}
      <div className="grid gap-6 lg:grid-cols-[400px,1fr]">
        {/* Left Panel - Controls */}
        <div className="space-y-6">
          {/* Document Type Selector */}
          <Card>
            <CardContent className="pt-6">
              <DocumentTypeSelector
                value={selectedType}
                onChange={setSelectedType}
                existingDocuments={generatedDocuments}
                disabled={isGenerating}
              />
            </CardContent>
          </Card>

          {/* Tone Selector */}
          <Card>
            <CardContent className="pt-6">
              <ToneSelector
                value={selectedTone}
                onChange={setSelectedTone}
                disabled={isGenerating}
              />
            </CardContent>
          </Card>

          {/* Data Summary */}
          {caseData && (
            <DataSummary caseData={caseData} documents={documents} />
          )}

          {/* Generate Button */}
          <div className="space-y-3">
            {isGenerating ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={cancel}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Stop Generation
              </Button>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={!hasRequiredDocs}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate {selectedType === 'DEMAND_LETTER' ? 'Demand Letter' : 'Document'}
              </Button>
            )}

            {displayContent && !isGenerating && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGenerate}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            )}
          </div>

          {/* Export Panel */}
          {displayContent && (
            <ExportPanel
              content={displayContent}
              documentId={selectedVersion?.id || getLatestVersion(selectedType)?.id}
              caseId={caseId}
              disabled={isGenerating}
            />
          )}

          {/* Version History */}
          {generatedDocuments.length > 0 && (
            <VersionHistory
              documents={generatedDocuments}
              currentType={selectedType}
              onSelect={handleVersionSelect}
            />
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)]">
          <LetterPreview
            content={displayContent}
            isLoading={isGenerating && !content}
            isStreaming={isStreaming}
            className="min-h-[500px] lg:h-[calc(100vh-12rem)]"
          />

          {/* Warnings */}
          {displayWarnings.length > 0 && (
            <WarningPanel warnings={displayWarnings} />
          )}

          {/* Error Message */}
          {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="py-4">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleGenerate}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
