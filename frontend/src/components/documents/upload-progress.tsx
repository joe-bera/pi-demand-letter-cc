'use client';

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FileText,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { UploadFile } from '@/hooks/use-document-upload';

interface UploadProgressProps {
  files: UploadFile[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onClearCompleted: () => void;
  className?: string;
}

export function UploadProgress({
  files,
  onRemove,
  onRetry,
  onClearCompleted,
  className,
}: UploadProgressProps) {
  if (files.length === 0) return null;

  const completedCount = files.filter((f) => f.status === 'completed').length;
  const hasCompleted = completedCount > 0;
  const allCompleted = completedCount === files.length;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-medium">
          Uploading {files.length} file{files.length !== 1 ? 's' : ''}
        </h3>
        {hasCompleted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCompleted}
          >
            Clear completed
          </Button>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto">
        {files.map((file) => (
          <UploadFileItem
            key={file.id}
            file={file}
            onRemove={() => onRemove(file.id)}
            onRetry={() => onRetry(file.id)}
          />
        ))}
      </div>
      {allCompleted && (
        <div className="flex items-center justify-center gap-2 border-t bg-success/10 px-4 py-3 text-success">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">All uploads complete!</span>
        </div>
      )}
    </Card>
  );
}

interface UploadFileItemProps {
  file: UploadFile;
  onRemove: () => void;
  onRetry: () => void;
}

function UploadFileItem({ file, onRemove, onRetry }: UploadFileItemProps) {
  const statusIcon = {
    pending: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    uploading: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    completed: <CheckCircle2 className="h-4 w-4 text-success" />,
    error: <AlertCircle className="h-4 w-4 text-destructive" />,
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b px-4 py-3 last:border-b-0 transition-colors',
        file.status === 'error' && 'bg-destructive/5',
        file.status === 'completed' && 'bg-success/5'
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{file.file.name}</p>
          {statusIcon[file.status]}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {formatFileSize(file.file.size)}
          </span>
          {file.status === 'uploading' && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-primary">{file.progress}%</span>
            </>
          )}
          {file.status === 'error' && file.error && (
            <span className="text-xs text-destructive">{file.error}</span>
          )}
        </div>
        {file.status === 'uploading' && (
          <Progress
            value={file.progress}
            size="sm"
            className="mt-2"
          />
        )}
      </div>

      <div className="flex items-center gap-1">
        {file.status === 'error' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRetry}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">Retry</span>
          </Button>
        )}
        {file.status !== 'uploading' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        )}
      </div>
    </div>
  );
}
