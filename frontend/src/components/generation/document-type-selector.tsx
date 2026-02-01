'use client';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { documentTypeOptions } from '@/hooks/use-generation';
import { GeneratedDocType, GeneratedDocument } from '@/types';
import {
  FileText,
  FileBarChart,
  AlertTriangle,
  Calendar,
  Calculator,
  Check,
  Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface DocumentTypeSelectorProps {
  value: GeneratedDocType;
  onChange: (value: GeneratedDocType) => void;
  existingDocuments?: GeneratedDocument[];
  disabled?: boolean;
  className?: string;
}

const iconMap = {
  FileText,
  FileBarChart,
  AlertTriangle,
  Calendar,
  Calculator,
};

export function DocumentTypeSelector({
  value,
  onChange,
  existingDocuments = [],
  disabled,
  className,
}: DocumentTypeSelectorProps) {
  const getExistingDocument = (type: GeneratedDocType): GeneratedDocument | undefined => {
    return existingDocuments
      .filter((doc) => doc.documentType === type)
      .sort((a, b) => b.version - a.version)[0];
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-base font-medium">Document Type</Label>
      <div className="space-y-2">
        {documentTypeOptions.map((option) => {
          const Icon = iconMap[option.icon as keyof typeof iconMap];
          const isSelected = value === option.value;
          const existingDoc = getExistingDocument(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={cn(
                'relative flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{option.label}</span>
                  {existingDoc && (
                    <Badge variant="secondary" size="sm">
                      v{existingDoc.version}
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground line-clamp-1">
                  {option.description}
                </span>
                {existingDoc && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last generated {formatDate(existingDoc.createdAt)}
                  </div>
                )}
              </div>
              {isSelected && (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
