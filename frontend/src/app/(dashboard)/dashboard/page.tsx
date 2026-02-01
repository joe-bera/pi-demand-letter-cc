'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Case } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate, formatShortDate } from '@/lib/utils';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  Activity,
} from 'lucide-react';

interface DashboardStats {
  totalCases: number;
  inProgress: number;
  completed: number;
  lettersGenerated: number;
  recentActivity: { action: string; case: string; time: string }[];
}

export default function DashboardPage() {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await api.get<DashboardStats>('/dashboard/stats');
        return response.data;
      } catch {
        // Return mock data if endpoint doesn't exist
        return {
          totalCases: 0,
          inProgress: 0,
          completed: 0,
          lettersGenerated: 0,
          recentActivity: [],
        };
      }
    },
  });

  // Fetch recent cases
  const { data: casesData, isLoading: casesLoading } = useQuery({
    queryKey: ['cases', { limit: 5 }],
    queryFn: async () => {
      const response = await api.get<Case[]>('/cases?limit=5');
      return response.data;
    },
  });

  const cases = casesData || [];

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's an overview of your cases."
        showBreadcrumbs={false}
        actions={
          <Link href="/cases/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Case
            </Button>
          </Link>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cases"
          value={stats?.totalCases ?? 0}
          icon={<FolderOpen className="h-5 w-5" />}
          trend="+12%"
          trendUp
          isLoading={statsLoading}
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgress ?? 0}
          icon={<Clock className="h-5 w-5" />}
          description="Active cases"
          isLoading={statsLoading}
        />
        <StatCard
          title="Completed"
          value={stats?.completed ?? 0}
          icon={<CheckCircle className="h-5 w-5" />}
          trend="+8%"
          trendUp
          isLoading={statsLoading}
        />
        <StatCard
          title="Letters Generated"
          value={stats?.lettersGenerated ?? 0}
          icon={<Sparkles className="h-5 w-5" />}
          description="This month"
          isLoading={statsLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Cases */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Recent Cases
            </CardTitle>
            <Link href="/cases">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {casesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : cases.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No cases yet"
                description="Create your first case to get started with demand letter generation."
                action={
                  <Link href="/cases/new">
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Case
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {cases.map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    href={`/cases/${caseItem.id}`}
                    className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {caseItem.clientFirstName} {caseItem.clientLastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {caseItem.incidentType.replace(/_/g, ' ')} •{' '}
                        {formatShortDate(caseItem.incidentDate)}
                      </p>
                    </div>
                    <StatusBadge status={caseItem.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/cases/new">
                <Button variant="outline" className="w-full justify-start">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Case
                </Button>
              </Link>
              <Link href="/cases">
                <Button variant="outline" className="w-full justify-start">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  View All Cases
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Customize Templates
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !stats?.recentActivity?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.case} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  description?: string;
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  description,
  isLoading,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{value}</p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        {trend && !isLoading && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            <TrendingUp
              className={`h-4 w-4 ${trendUp ? 'text-success' : 'text-destructive'}`}
            />
            <span className={trendUp ? 'text-success' : 'text-destructive'}>
              {trend}
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
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
    DOCUMENTS_UPLOADED: 'Documents',
    PROCESSING: 'Processing',
    EXTRACTION_COMPLETE: 'Extracted',
    DRAFT_READY: 'Draft Ready',
    UNDER_REVIEW: 'Review',
    SENT: 'Sent',
    SETTLED: 'Settled',
    LITIGATION: 'Litigation',
    CLOSED: 'Closed',
  };

  return (
    <Badge variant={statusVariants[status] || 'secondary'} size="sm">
      {statusLabels[status] || status}
    </Badge>
  );
}
