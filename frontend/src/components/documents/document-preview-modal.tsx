'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { Document } from '@/types';
import { getCategoryDisplayName } from '@/hooks/use-documents';
import { formatDate } from '@/lib/utils';

interface DocumentPreviewModalProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: () => void;
  /** For navigating between documents */
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function DocumentPreviewModal({
  document,
  open,
  onOpenChange,
  onDownload,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState('preview');

  if (!document) return null;

  const isImage = document.mimeType.startsWith('image/');
  const isPdf = document.mimeType === 'application/pdf';

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate">
                  {document.originalFilename}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" size="sm">
                    {getCategoryDisplayName(document.category)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(document.fileSize)}
                  </span>
                  {document.pageCount && (
                    <span className="text-xs text-muted-foreground">
                      • {document.pageCount} pages
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onDownload && (
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(document.fileUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="border-b px-6">
            <TabsList className="h-auto bg-transparent p-0">
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary pb-3 pt-2"
              >
                Preview
              </TabsTrigger>
              {document.extractedText && (
                <TabsTrigger
                  value="text"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary pb-3 pt-2"
                >
                  Extracted Text
                </TabsTrigger>
              )}
              {document.extractedData !== undefined && document.extractedData !== null && (
                <TabsTrigger
                  value="data"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary pb-3 pt-2"
                >
                  Extracted Data
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="preview" className="flex-1 m-0 data-[state=active]:flex flex-col">
            {/* Toolbar */}
            {(isImage || isPdf) && (
              <div className="flex items-center justify-center gap-2 border-b px-4 py-2 bg-muted/30">
                <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                {isImage && (
                  <Button variant="ghost" size="icon" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Preview Area */}
            <div className="flex-1 overflow-auto bg-muted/20 relative">
              {isPdf ? (
                <iframe
                  src={`${document.fileUrl}#view=FitH`}
                  className="w-full h-full border-0"
                  title={document.originalFilename}
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                />
              ) : isImage ? (
                <div className="flex items-center justify-center min-h-full p-4">
                  <img
                    src={document.fileUrl}
                    alt={document.originalFilename}
                    className="max-w-full max-h-full object-contain transition-transform"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Preview not available for this file type.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={onDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download to view
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation Arrows */}
              {(hasPrevious || hasNext) && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 opacity-75 hover:opacity-100"
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-75 hover:opacity-100"
                    onClick={onNext}
                    disabled={!hasNext}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="text" className="flex-1 m-0 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {document.extractedText}
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="data" className="flex-1 m-0 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(document.extractedData, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
