'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Eye, Download, Clock, Gauge } from 'lucide-react';
import { GeneratedDocument, GeneratedDocType } from '@/types';
import { formatDate } from '@/lib/utils';
import { documentTypeOptions } from '@/hooks/use-generation';

interface VersionHistoryProps {
  documents: GeneratedDocument[];
  currentType?: GeneratedDocType;
  onSelect?: (document: GeneratedDocument) => void;
  className?: string;
}

export function VersionHistory({
  documents,
  currentType,
  onSelect,
  className,
}: VersionHistoryProps) {
  // Filter by current type if specified
  const filteredDocs = currentType
    ? documents.filter((doc) => doc.documentType === currentType)
    : documents;

  // Sort by version descending
  const sortedDocs = [...filteredDocs].sort((a, b) => {
    // First by type, then by version
    if (a.documentType !== b.documentType) {
      return a.documentType.localeCompare(b.documentType);
    }
    return b.version - a.version;
  });

  if (sortedDocs.length === 0) {
    return null;
  }

  const getDocTypeLabel = (type: GeneratedDocType): string => {
    return documentTypeOptions.find((opt) => opt.value === type)?.label || type;
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          Version History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px]">
          <div className="divide-y">
            {sortedDocs.map((doc, index) => (
              <div
                key={doc.id}
                className={cn(
                  'flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors',
                  index === 0 && 'bg-primary/5'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" size="sm">
                      v{doc.version}
                    </Badge>
                    {!currentType && (
                      <Badge variant="secondary" size="sm">
                        {getDocTypeLabel(doc.documentType)}
                      </Badge>
                    )}
                    {index === 0 && (
                      <Badge variant="success" size="sm">
                        Latest
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(doc.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="h-3 w-3" />
                      {doc.tone}
                    </span>
                    {doc.warnings && doc.warnings.length > 0 && (
                      <span className="text-warning">
                        {doc.warnings.length} warning{doc.warnings.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onSelect?.(doc)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View</span>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Compact inline version
export function VersionBadge({
  documents,
  currentType,
  onSelect,
}: {
  documents: GeneratedDocument[];
  currentType: GeneratedDocType;
  onSelect?: (document: GeneratedDocument) => void;
}) {
  const versions = documents
    .filter((doc) => doc.documentType === currentType)
    .sort((a, b) => b.version - a.version);

  if (versions.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Previous versions:</span>
      <div className="flex gap-1">
        {versions.slice(0, 5).map((doc) => (
          <Button
            key={doc.id}
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={() => onSelect?.(doc)}
          >
            v{doc.version}
          </Button>
        ))}
        {versions.length > 5 && (
          <span className="text-xs text-muted-foreground self-center">
            +{versions.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
}
