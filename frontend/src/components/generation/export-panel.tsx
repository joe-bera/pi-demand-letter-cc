'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileText,
  File,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  Mail,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';

interface ExportPanelProps {
  content: string;
  documentId?: string;
  caseId: string;
  disabled?: boolean;
  className?: string;
}

export function ExportPanel({
  content,
  documentId,
  caseId,
  disabled,
  className,
}: ExportPanelProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!documentId) {
      toast.error('Please generate a document first');
      return;
    }

    setExporting(format);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/cases/${caseId}/generated-documents/${documentId}/export?format=${format}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demand-letter.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Demand Letter</title>
            <style>
              body {
                font-family: 'Times New Roman', serif;
                line-height: 1.6;
                padding: 1in;
                max-width: 8.5in;
                margin: 0 auto;
              }
              h1, h2, h3 { margin-top: 1.5em; }
              p { margin: 1em 0; }
            </style>
          </head>
          <body>
            ${content.replace(/\n/g, '<br/>')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          Export Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Primary Export Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('docx')}
            disabled={disabled || !content || exporting === 'docx'}
          >
            {exporting === 'docx' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Word (.docx)
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={disabled || !content || exporting === 'pdf'}
          >
            {exporting === 'pdf' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <File className="mr-2 h-4 w-4" />
            )}
            PDF
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={handleCopyToClipboard}
            disabled={disabled || !content}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={handlePrint}
            disabled={disabled || !content}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>

        {/* Email Option */}
        <Button
          variant="secondary"
          className="w-full"
          disabled={disabled || !content}
        >
          <Mail className="mr-2 h-4 w-4" />
          Send via Email
        </Button>
      </CardContent>
    </Card>
  );
}

// Compact version for inline use
export function ExportButton({
  content,
  documentId,
  caseId,
  disabled,
}: Omit<ExportPanelProps, 'className'>) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'docx' | 'pdf' | 'copy') => {
    if (format === 'copy') {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
      return;
    }

    if (!documentId) {
      toast.error('Please generate a document first');
      return;
    }

    setExporting(format);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/cases/${caseId}/generated-documents/${documentId}/export?format=${format}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demand-letter.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={disabled || !content}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('docx')}>
          <FileText className="mr-2 h-4 w-4" />
          Word Document (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <File className="mr-2 h-4 w-4" />
          PDF Document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('copy')}>
          <Copy className="mr-2 h-4 w-4" />
          Copy to Clipboard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
