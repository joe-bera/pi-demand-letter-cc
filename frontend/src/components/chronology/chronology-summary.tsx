'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface ChronologySummaryProps {
  summary: string;
  narrative?: string;
}

export function ChronologySummary({ summary, narrative }: ChronologySummaryProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Summary
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(narrative || summary)}
          >
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Copy for Demand Letter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Executive Summary</TabsTrigger>
            {narrative && <TabsTrigger value="narrative">Full Narrative</TabsTrigger>}
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </TabsContent>

          {narrative && (
            <TabsContent value="narrative" className="mt-4">
              <div
                className={`prose prose-sm max-w-none dark:prose-invert ${
                  !expanded ? 'max-h-96 overflow-hidden relative' : ''
                }`}
              >
                <ReactMarkdown>{narrative}</ReactMarkdown>
                {!expanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
                )}
              </div>
              <Button
                variant="ghost"
                className="mt-2 w-full"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show Full Narrative
                  </>
                )}
              </Button>
            </TabsContent>
          )}
        </Tabs>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Use the "Copy for Demand Letter" button to insert this
            narrative directly into your demand letter. You can edit it as needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
