'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Case } from '@/types';
import { formatDate, formatCurrency, formatShortDate } from '@/lib/utils';
import { PageHeader, PageHeaderSkeleton } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Upload,
  Sparkles,
  Download,
  ArrowRight,
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  Car,
  Building2,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface DamagesCalculation {
  specialDamages?: {
    medicalBills?: number;
    wageLoss?: number;
    total?: number;
  };
  generalDamages?: {
    total?: number;
  };
  total?: number;
}

interface Warning {
  message: string;
  severity: 'critical' | 'moderate' | 'minor';
}

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: () => api.get<Case>(`/cases/${id}`),
  });

  const caseData = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton showActions />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Case not found"
        description="The case you're looking for doesn't exist or has been removed."
        action={
          <Link href="/cases">
            <Button>View All Cases</Button>
          </Link>
        }
      />
    );
  }

  const clientName = `${caseData.clientFirstName} ${caseData.clientLastName}`;
  const damages = caseData.damagesCalculation as DamagesCalculation | undefined;
  const warnings = caseData.attorneyWarnings as Warning[] | undefined;

  const statusVariants: Record<string, 'intake' | 'processing' | 'ready' | 'review' | 'sent' | 'settled' | 'closed'> = {
    INTAKE: 'intake',
    DOCUMENTS_UPLOADED: 'intake',
    PROCESSING: 'processing',
    EXTRACTION_COMPLETE: 'processing',
    DRAFT_READY: 'ready',
    UNDER_REVIEW: 'review',
    SENT: 'sent',
    SETTLED: 'settled',
    LITIGATION: 'review',
    CLOSED: 'closed',
  };

  const statusLabels: Record<string, string> = {
    INTAKE: 'Intake',
    DOCUMENTS_UPLOADED: 'Documents Uploaded',
    PROCESSING: 'Processing',
    EXTRACTION_COMPLETE: 'Extraction Complete',
    DRAFT_READY: 'Draft Ready',
    UNDER_REVIEW: 'Under Review',
    SENT: 'Sent',
    SETTLED: 'Settled',
    LITIGATION: 'Litigation',
    CLOSED: 'Closed',
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={clientName}
        description={`${caseData.incidentType.replace(/_/g, ' ')} • ${formatShortDate(caseData.incidentDate)}`}
        breadcrumbItems={[
          { label: 'Cases', href: '/cases' },
          { label: clientName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/cases/${id}/documents`}>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Documents
              </Button>
            </Link>
            <Link href={`/cases/${id}/generate`}>
              <Button>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Letter
              </Button>
            </Link>
          </div>
        }
      >
        <Badge variant={statusVariants[caseData.status] || 'secondary'}>
          {statusLabels[caseData.status] || caseData.status}
        </Badge>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-muted-foreground" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{clientName}</p>
              </div>
              {caseData.clientEmail && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{caseData.clientEmail}</p>
                </div>
              )}
              {caseData.clientPhone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{caseData.clientPhone}</p>
                </div>
              )}
              {caseData.clientAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{caseData.clientAddress}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incident Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-4 w-4 text-muted-foreground" />
                Incident Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Incident Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(caseData.incidentDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Incident Type</p>
                  <p className="font-medium">
                    {caseData.incidentType.replace(/_/g, ' ')}
                  </p>
                </div>
                {caseData.incidentLocation && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {caseData.incidentLocation}
                    </p>
                  </div>
                )}
              </div>
              {caseData.incidentDescription && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{caseData.incidentDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Defendant/Insurance Information */}
          {(caseData.defendantName || caseData.defendantInsuranceCompany) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Defendant & Insurance
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {caseData.defendantName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Defendant Name</p>
                    <p className="font-medium">{caseData.defendantName}</p>
                  </div>
                )}
                {caseData.defendantInsuranceCompany && (
                  <div>
                    <p className="text-sm text-muted-foreground">Insurance Company</p>
                    <p className="font-medium">{caseData.defendantInsuranceCompany}</p>
                  </div>
                )}
                {caseData.claimNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Claim Number</p>
                    <p className="font-medium">{caseData.claimNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Jurisdiction</p>
                  <p className="font-medium">{caseData.jurisdiction}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Documents
              </CardTitle>
              <Link href={`/cases/${id}/documents`}>
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {caseData._count?.documents ? (
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {caseData._count.documents} document{caseData._count.documents !== 1 ? 's' : ''} uploaded
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ready for processing
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Upload}
                  title="No documents uploaded"
                  description="Upload medical records, bills, and other case documents."
                  size="sm"
                  action={
                    <Link href={`/cases/${id}/documents`}>
                      <Button size="sm">Upload Documents</Button>
                    </Link>
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/cases/${id}/documents`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
              </Link>
              <Link href={`/cases/${id}/generate`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Letter
                </Button>
              </Link>
              {caseData._count?.generatedDocuments ? (
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Download Latest
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {/* Damages Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Damages Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {damages ? (
                <div className="space-y-3">
                  {damages.specialDamages?.medicalBills !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Medical Bills</span>
                      <span className="font-medium">
                        {formatCurrency(damages.specialDamages.medicalBills)}
                      </span>
                    </div>
                  )}
                  {damages.specialDamages?.wageLoss !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Wage Loss</span>
                      <span className="font-medium">
                        {formatCurrency(damages.specialDamages.wageLoss)}
                      </span>
                    </div>
                  )}
                  {damages.specialDamages?.total !== undefined && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">Total Special</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(damages.specialDamages.total)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Upload documents to calculate damages
                </p>
              )}
            </CardContent>
          </Card>

          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <Card className="border-warning">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {warnings.map((warning, index) => (
                    <li
                      key={index}
                      className={`text-sm p-2 rounded-md flex items-start gap-2 ${
                        warning.severity === 'critical'
                          ? 'bg-destructive/10 text-destructive'
                          : warning.severity === 'moderate'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {warning.severity === 'critical' ? (
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      )}
                      {warning.message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Case Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-success" />
                  <div>
                    <p className="text-sm font-medium">Case Created</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(caseData.createdAt)}
                    </p>
                  </div>
                </div>
                {caseData._count?.documents ? (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-success" />
                    <div>
                      <p className="text-sm font-medium">Documents Uploaded</p>
                      <p className="text-xs text-muted-foreground">
                        {caseData._count.documents} document{caseData._count.documents !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ) : null}
                {caseData._count?.generatedDocuments ? (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-success" />
                    <div>
                      <p className="text-sm font-medium">Letter Generated</p>
                      <p className="text-xs text-muted-foreground">
                        {caseData._count.generatedDocuments} version{caseData._count.generatedDocuments !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
