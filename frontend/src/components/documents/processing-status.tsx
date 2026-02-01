'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  XCircle,
  Sparkles,
  Brain,
  Tag,
} from 'lucide-react';
import { Document } from '@/types';

interface ProcessingStatusProps {
  documents: Document[];
  className?: string;
}

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export function ProcessingStatus({ documents, className }: ProcessingStatusProps) {
  // Calculate processing stats
  const stats = {
    total: documents.length,
    pending: documents.filter((d) => d.processingStatus === 'PENDING').length,
    extracting: documents.filter((d) => d.processingStatus === 'EXTRACTING_TEXT').length,
    classifying: documents.filter((d) => d.processingStatus === 'CLASSIFYING').length,
    extractingData: documents.filter((d) => d.processingStatus === 'EXTRACTING_DATA').length,
    completed: documents.filter((d) => d.processingStatus === 'COMPLETED').length,
    failed: documents.filter((d) => d.processingStatus === 'FAILED').length,
  };

  const isProcessing = stats.pending + stats.extracting + stats.classifying + stats.extractingData > 0;
  const progressValue = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  // Determine active step
  const getActiveStep = (): string | null => {
    if (stats.extracting > 0) return 'extract';
    if (stats.classifying > 0) return 'classify';
    if (stats.extractingData > 0) return 'data';
    if (stats.pending > 0) return 'upload';
    return null;
  };

  const activeStep = getActiveStep();

  const steps: ProcessingStep[] = [
    {
      id: 'upload',
      label: 'Upload',
      icon: <FileText className="h-4 w-4" />,
      status: stats.pending > 0 ? 'active' : stats.total > 0 ? 'completed' : 'pending',
    },
    {
      id: 'extract',
      label: 'Extract Text',
      icon: <Sparkles className="h-4 w-4" />,
      status:
        stats.extracting > 0
          ? 'active'
          : stats.classifying > 0 || stats.extractingData > 0 || stats.completed > 0
          ? 'completed'
          : stats.pending > 0
          ? 'pending'
          : 'pending',
    },
    {
      id: 'classify',
      label: 'Classify',
      icon: <Tag className="h-4 w-4" />,
      status:
        stats.classifying > 0
          ? 'active'
          : stats.extractingData > 0 || stats.completed > 0
          ? 'completed'
          : stats.pending > 0 || stats.extracting > 0
          ? 'pending'
          : 'pending',
    },
    {
      id: 'data',
      label: 'Extract Data',
      icon: <Brain className="h-4 w-4" />,
      status:
        stats.extractingData > 0
          ? 'active'
          : stats.completed > 0
          ? 'completed'
          : stats.pending > 0 || stats.extracting > 0 || stats.classifying > 0
          ? 'pending'
          : 'pending',
    },
  ];

  if (!isProcessing && stats.total === 0) {
    return null;
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Processing Status</CardTitle>
          <Badge
            variant={isProcessing ? 'warning' : stats.failed > 0 ? 'destructive' : 'success'}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Processing
              </>
            ) : stats.failed > 0 ? (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                {stats.failed} Failed
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Complete
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {stats.completed} of {stats.total} documents processed
            </span>
            <span className="font-medium">{Math.round(progressValue)}%</span>
          </div>
          <Progress
            value={progressValue}
            variant={stats.failed > 0 ? 'destructive' : isProcessing ? 'warning' : 'success'}
          />
        </div>

        {/* Processing Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <ProcessingStepIndicator step={step} />
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-8 mx-2 transition-colors',
                    step.status === 'completed' ? 'bg-success' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Active Processing Message */}
        {isProcessing && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-muted-foreground">
              {activeStep === 'extract' && `Extracting text from ${stats.extracting} document(s)...`}
              {activeStep === 'classify' && `Classifying ${stats.classifying} document(s)...`}
              {activeStep === 'data' && `Extracting data from ${stats.extractingData} document(s)...`}
              {activeStep === 'upload' && `Waiting to process ${stats.pending} document(s)...`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProcessingStepIndicator({ step }: { step: ProcessingStep }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          step.status === 'completed' && 'bg-success text-success-foreground',
          step.status === 'active' && 'bg-primary text-primary-foreground',
          step.status === 'pending' && 'bg-muted text-muted-foreground',
          step.status === 'error' && 'bg-destructive text-destructive-foreground'
        )}
      >
        {step.status === 'completed' ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : step.status === 'active' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : step.status === 'error' ? (
          <XCircle className="h-4 w-4" />
        ) : (
          step.icon
        )}
      </div>
      <span
        className={cn(
          'text-xs',
          step.status === 'active' ? 'font-medium text-foreground' : 'text-muted-foreground'
        )}
      >
        {step.label}
      </span>
    </div>
  );
}
