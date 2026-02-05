'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MedicalEvent, MedicalChronology } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Calendar,
  DollarSign,
  Users,
  Activity,
  AlertTriangle,
  RefreshCw,
  FileText,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { MedicalTimeline } from '@/components/chronology/medical-timeline';
import { ChronologyTable } from '@/components/chronology/chronology-table';
import { PainScoreChart } from '@/components/chronology/pain-score-chart';
import { CostBreakdown } from '@/components/chronology/cost-breakdown';
import { TreatmentGapAlert } from '@/components/chronology/treatment-gap-alert';
import { ChronologySummary } from '@/components/chronology/chronology-summary';

interface ChronologyResponse {
  success: boolean;
  data: MedicalChronology;
}

interface MedicalEventsResponse {
  success: boolean;
  data: {
    events: MedicalEvent[];
    summary: {
      totalEvents: number;
      totalCosts: number;
      uniqueProviders: number;
      dateRange: { start: string; end: string } | null;
    };
  };
}

export default function ChronologyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: caseId } = use(params);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('timeline');

  // Fetch chronology
  const { data: chronologyData, isLoading: chronologyLoading } = useQuery({
    queryKey: ['chronology', caseId],
    queryFn: async () => {
      const response = await api.get<MedicalChronology>(`/cases/${caseId}/chronology`);
      return response.data;
    },
  });

  // Fetch medical events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['medical-events', caseId],
    queryFn: async () => {
      const response = await api.get<MedicalEventsResponse['data']>(`/cases/${caseId}/medical-events`);
      return response.data;
    },
  });

  // Generate chronology mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<MedicalChronology>(`/cases/${caseId}/chronology/generate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chronology', caseId] });
      toast.success('Chronology generated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate chronology');
    },
  });

  const isLoading = chronologyLoading || eventsLoading;
  const chronology = chronologyData;
  const events = eventsData?.events || [];
  const summary = eventsData?.summary;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const hasEvents = events.length > 0;
  const hasChronology = !!chronology;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medical Chronology"
        description={hasChronology
          ? `${chronology.totalVisits} visits over ${chronology.treatmentDurationDays} days`
          : 'Generate a chronology from your medical records'
        }
        actions={
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !hasEvents}
          >
            {generateMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {hasChronology ? 'Regenerate' : 'Generate'} Chronology
          </Button>
        }
      />

      {!hasEvents && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Medical Records Processed</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Upload and process medical records or bills to generate a medical chronology.
              The system will automatically extract treatment dates, diagnoses, and costs.
            </p>
            <Button className="mt-4" variant="outline" asChild>
              <a href={`/cases/${caseId}/documents`}>Upload Documents</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasEvents && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chronology?.totalVisits || events.length}</div>
                <p className="text-xs text-muted-foreground">
                  {chronology?.treatmentDurationDays
                    ? `Over ${chronology.treatmentDurationDays} days`
                    : 'Medical encounters'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(chronology?.totalMedicalCosts || summary?.totalCosts || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Medical expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Providers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {chronology?.providersSummary?.length || summary?.uniqueProviders || 0}
                </div>
                <p className="text-xs text-muted-foreground">Healthcare providers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Treatment Gaps</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {chronology?.treatmentGaps?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(chronology?.treatmentGaps?.length || 0) > 0 ? 'Gaps > 30 days' : 'No significant gaps'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Treatment Gaps Alerts */}
          {chronology?.treatmentGaps && chronology.treatmentGaps.length > 0 && (
            <TreatmentGapAlert gaps={chronology.treatmentGaps} />
          )}

          {/* Executive Summary */}
          {chronology?.executiveSummary && (
            <ChronologySummary
              summary={chronology.executiveSummary}
              narrative={chronology.chronologyNarrative}
            />
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="timeline">
                <Clock className="mr-2 h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="table">
                <FileText className="mr-2 h-4 w-4" />
                Table View
              </TabsTrigger>
              <TabsTrigger value="pain">
                <Activity className="mr-2 h-4 w-4" />
                Pain Scores
              </TabsTrigger>
              <TabsTrigger value="costs">
                <DollarSign className="mr-2 h-4 w-4" />
                Costs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-6">
              <MedicalTimeline
                events={events}
                gaps={chronology?.treatmentGaps}
              />
            </TabsContent>

            <TabsContent value="table" className="mt-6">
              <ChronologyTable events={events} />
            </TabsContent>

            <TabsContent value="pain" className="mt-6">
              <PainScoreChart
                painHistory={chronology?.painScoreHistory || []}
                events={events}
              />
            </TabsContent>

            <TabsContent value="costs" className="mt-6">
              <CostBreakdown
                caseId={caseId}
                providersSummary={chronology?.providersSummary}
                totalCosts={chronology?.totalMedicalCosts || 0}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
