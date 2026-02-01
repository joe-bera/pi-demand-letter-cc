'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  validateFile,
} from '@/hooks/use-document-upload';
import { toast } from 'sonner';

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function UploadZone({
  onFilesAdded,
  disabled = false,
  className,
}: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Validate each file
      const validFiles: File[] = [];
      const errors: string[] = [];

      acceptedFiles.forEach((file) => {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      });

      rejectedFiles.forEach((rejection) => {
        const file = rejection.file;
        errors.push(`${file.name}: File type not supported`);
      });

      if (errors.length > 0) {
        toast.error('Some files were rejected', {
          description: errors.slice(0, 3).join('\n'),
        });
      }

      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ALLOWED_FILE_TYPES,
      maxSize: MAX_FILE_SIZE,
      disabled,
      multiple: true,
    });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all duration-200 cursor-pointer',
        isDragActive && !isDragReject && 'border-primary bg-primary/5 scale-[1.02]',
        isDragReject && 'border-destructive bg-destructive/5',
        !isDragActive && !disabled && 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />

      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-200',
          isDragActive && !isDragReject ? 'bg-primary/10' : 'bg-muted',
          isDragReject && 'bg-destructive/10'
        )}
      >
        {isDragReject ? (
          <X className="h-7 w-7 text-destructive" />
        ) : (
          <Upload
            className={cn(
              'h-7 w-7 transition-colors',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-base font-medium">
          {isDragActive
            ? isDragReject
              ? 'Some files are not supported'
              : 'Drop files here'
            : 'Drag & drop files here'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          or click to browse
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          <FileText className="mr-1 h-3 w-3" />
          PDF
        </span>
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          JPG, PNG
        </span>
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          DOC, DOCX
        </span>
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          Max 50MB
        </span>
      </div>
    </div>
  );
}

interface CompactUploadZoneProps extends UploadZoneProps {}

export function CompactUploadZone({
  onFilesAdded,
  disabled = false,
  className,
}: CompactUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter(
        (file) => validateFile(file).valid
      );
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-dashed p-4 transition-all cursor-pointer',
        isDragActive && 'border-primary bg-primary/5',
        !isDragActive && !disabled && 'border-muted-foreground/25 hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Upload className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {isDragActive ? 'Drop files here' : 'Add more documents'}
        </p>
        <p className="text-xs text-muted-foreground">
          Drag & drop or click to upload
        </p>
      </div>
      <Button variant="outline" size="sm" disabled={disabled}>
        Browse
      </Button>
    </div>
  );
}
