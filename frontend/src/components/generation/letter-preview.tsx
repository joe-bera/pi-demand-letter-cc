'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';

interface LetterPreviewProps {
  content: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  className?: string;
}

export function LetterPreview({
  content,
  isLoading,
  isStreaming,
  className,
}: LetterPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [content, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading && !content) {
    return (
      <Card className={cn('flex flex-col h-full', className)}>
        <CardHeader className="shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Document Preview
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Generating document...</p>
            <p className="text-xs text-muted-foreground mt-1">
              This may take a few moments
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!content) {
    return (
      <Card className={cn('flex flex-col h-full', className)}>
        <CardHeader className="shrink-0 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Document Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select options and click Generate to preview your document</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'flex flex-col transition-all',
        isFullscreen && 'fixed inset-4 z-50 h-auto',
        !isFullscreen && 'h-full',
        className
      )}
    >
      <CardHeader className="shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Document Preview
            {isStreaming && (
              <span className="flex items-center gap-1 text-xs font-normal text-primary animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating...
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
              disabled={!content}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <ScrollArea ref={scrollRef} className="flex-1">
        <CardContent className="p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

// Skeleton for loading state
export function LetterPreviewSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="shrink-0 border-b">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  );
}
