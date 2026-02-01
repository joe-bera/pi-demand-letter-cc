'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Image,
  File,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  RotateCcw,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Document, DocumentCategory } from '@/types';
import { getCategoryDisplayName, getProcessingStatusDisplay } from '@/hooks/use-documents';
import { formatDate } from '@/lib/utils';

interface DocumentCardProps {
  document: Document;
  onPreview?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onReprocess?: () => void;
  onCategoryChange?: (category: DocumentCategory) => void;
  className?: string;
}

export function DocumentCard({
  document,
  onPreview,
  onDownload,
  onDelete,
  onReprocess,
  onCategoryChange,
  className,
}: DocumentCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getFileIcon = () => {
    if (document.mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5" />;
    }
    if (document.mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isProcessing = ['PENDING', 'EXTRACTING_TEXT', 'CLASSIFYING', 'EXTRACTING_DATA'].includes(
    document.processingStatus
  );
  const isFailed = document.processingStatus === 'FAILED';
  const isCompleted = document.processingStatus === 'COMPLETED';

  const statusDisplay = getProcessingStatusDisplay(document.processingStatus);

  return (
    <Card
      className={cn(
        'group relative transition-all duration-200 hover:shadow-md',
        isProcessing && 'border-warning/30',
        isFailed && 'border-destructive/30 bg-destructive/5',
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* File Icon */}
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg shrink-0 transition-colors',
              isCompleted && 'bg-primary/10 text-primary',
              isProcessing && 'bg-warning/10 text-warning',
              isFailed && 'bg-destructive/10 text-destructive'
            )}
          >
            {getFileIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate" title={document.originalFilename}>
                  {document.originalFilename}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(document.fileSize)}
                  </span>
                  {document.pageCount && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {document.pageCount} page{document.pageCount !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                  {document.providerName && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {document.providerName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onPreview}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  {isFailed && onReprocess && (
                    <DropdownMenuItem onClick={onReprocess}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reprocess
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status & Category */}
            <div className="flex items-center gap-2 mt-3">
              <Badge variant={statusDisplay.color === 'success' ? 'success' : statusDisplay.color === 'destructive' ? 'destructive' : statusDisplay.color === 'warning' ? 'warning' : 'secondary'} size="sm">
                {isProcessing && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                {isCompleted && <CheckCircle2 className="mr-1 h-3 w-3" />}
                {isFailed && <AlertCircle className="mr-1 h-3 w-3" />}
                {statusDisplay.label}
              </Badge>
              <Badge variant="outline" size="sm">
                <Tag className="mr-1 h-3 w-3" />
                {getCategoryDisplayName(document.category)}
              </Badge>
            </div>

            {/* Processing Progress */}
            {isProcessing && (
              <div className="mt-3">
                <Progress
                  indeterminate
                  size="sm"
                  variant="warning"
                />
              </div>
            )}

            {/* Error Message */}
            {isFailed && document.processingError && (
              <p className="mt-2 text-xs text-destructive">
                {document.processingError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/95 rounded-lg animate-fade-in">
          <div className="text-center p-4">
            <p className="font-medium">Delete this document?</p>
            <p className="text-sm text-muted-foreground mt-1">
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete?.();
                  setShowDeleteConfirm(false);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// Skeleton version
export function DocumentCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          <div className="flex gap-2 mt-3">
            <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
            <div className="h-5 w-24 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </Card>
  );
}
