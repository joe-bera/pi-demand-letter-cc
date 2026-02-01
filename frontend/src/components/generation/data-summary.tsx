'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  DollarSign,
  Calendar,
  MapPin,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Case, Document } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DataSummaryProps {
  caseData: Case;
  documents: Document[];
  className?: string;
}

export function DataSummary({ caseData, documents, className }: DataSummaryProps) {
  const [expanded, setExpanded] = useState(true);

  const completedDocs = documents.filter((d) => d.processingStatus === 'COMPLETED');
  const failedDocs = documents.filter((d) => d.processingStatus === 'FAILED');

  // Calculate totals from extracted data if available
  const damagesData = caseData.damagesCalculation as {
    medicalExpenses?: number;
    lostWages?: number;
    painAndSuffering?: number;
    total?: number;
  } | null;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Extracted Data Summary
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Client Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Client Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium">
                  {caseData.clientFirstName} {caseData.clientLastName}
                </span>
              </div>
              {caseData.clientDateOfBirth && (
                <div>
                  <span className="text-muted-foreground">DOB:</span>
                  <span className="ml-2">
                    {formatDate(caseData.clientDateOfBirth)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Incident Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Incident Details
            </h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" size="sm">
                  {caseData.incidentType.replace(/_/g, ' ')}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span>{formatDate(caseData.incidentDate)}</span>
              </div>
              {caseData.incidentLocation && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{caseData.incidentLocation}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Documents Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Documents Analyzed
            </h4>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>{completedDocs.length} processed</span>
              </div>
              {failedDocs.length > 0 && (
                <div className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{failedDocs.length} failed</span>
                </div>
              )}
            </div>
          </div>

          {/* Damages Summary */}
          {damagesData && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Damages Summary
                </h4>
                <div className="space-y-1.5 text-sm">
                  {damagesData.medicalExpenses !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Medical Expenses</span>
                      <span>{formatCurrency(damagesData.medicalExpenses)}</span>
                    </div>
                  )}
                  {damagesData.lostWages !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lost Wages</span>
                      <span>{formatCurrency(damagesData.lostWages)}</span>
                    </div>
                  )}
                  {damagesData.painAndSuffering !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pain & Suffering</span>
                      <span>{formatCurrency(damagesData.painAndSuffering)}</span>
                    </div>
                  )}
                  {damagesData.total !== undefined && (
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Total Demand</span>
                      <span className="text-primary">
                        {formatCurrency(damagesData.total)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Edit Button */}
          <Button variant="outline" size="sm" className="w-full mt-2">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Extracted Data
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
