'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Case, CaseStatus } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatShortDate } from '@/lib/utils';
import {
  PlusCircle,
  Search,
  Filter,
  FileText,
  MoreVertical,
  Eye,
  Upload,
  Sparkles,
  Trash2,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'INTAKE', label: 'Intake' },
  { value: 'DOCUMENTS_UPLOADED', label: 'Documents Uploaded' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'EXTRACTION_COMPLETE', label: 'Extraction Complete' },
  { value: 'DRAFT_READY', label: 'Draft Ready' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'SENT', label: 'Sent' },
  { value: 'SETTLED', label: 'Settled' },
  { value: 'CLOSED', label: 'Closed' },
];

const ITEMS_PER_PAGE = 10;

export default function CasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State from URL params
  const initialSearch = searchParams.get('search') || '';
  const initialStatus = searchParams.get('status') || 'all';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch cases
  const { data: casesData, isLoading } = useQuery({
    queryKey: ['cases', { search: debouncedSearch, status: statusFilter, page: currentPage }],
    queryFn: async () => {
      let url = '/cases?';
      if (debouncedSearch) url += `search=${encodeURIComponent(debouncedSearch)}&`;
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      url += `page=${currentPage}&limit=${ITEMS_PER_PAGE}`;

      const response = await api.get<{ cases: Case[]; total: number }>(url);
      return response.data;
    },
  });

  const cases = casesData?.cases || (Array.isArray(casesData) ? casesData : []);
  const totalCases = casesData?.total || cases.length;
  const totalPages = Math.ceil(totalCases / ITEMS_PER_PAGE);

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasFilters = searchQuery || statusFilter !== 'all';

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Cases"
        description={`${totalCases} total case${totalCases !== 1 ? 's' : ''}`}
        actions={
          <Link href="/cases/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Case
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Input
                placeholder="Search by client name or case number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="h-4 w-4" />}
                rightIcon={
                  searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : undefined
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FolderOpen}
                title={hasFilters ? 'No cases found' : 'No cases yet'}
                description={
                  hasFilters
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Create your first case to get started with demand letter generation.'
                }
                action={
                  hasFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  ) : (
                    <Link href="/cases/new">
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Case
                      </Button>
                    </Link>
                  )
                }
              />
            </div>
          ) : (
            <div className="divide-y">
              {cases.map((caseItem) => (
                <CaseRow key={caseItem.id} caseItem={caseItem} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalCases)} of {totalCases} cases
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                  }
                  if (currentPage > totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    className="w-9"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CaseRow({ caseItem }: { caseItem: Case }) {
  const router = useRouter();

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
    <div className="group flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
      <Link
        href={`/cases/${caseItem.id}`}
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0"
      >
        <FileText className="h-6 w-6" />
      </Link>
      <Link href={`/cases/${caseItem.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {caseItem.clientFirstName} {caseItem.clientLastName}
          </p>
          {caseItem.caseNumber && (
            <span className="text-sm text-muted-foreground">
              #{caseItem.caseNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{caseItem.incidentType.replace(/_/g, ' ')}</span>
          <span>•</span>
          <span>{formatShortDate(caseItem.incidentDate)}</span>
          <span>•</span>
          <span>{caseItem._count?.documents || 0} docs</span>
        </div>
      </Link>
      <Badge variant={statusVariants[caseItem.status] || 'secondary'} size="sm">
        {statusLabels[caseItem.status] || caseItem.status}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/cases/${caseItem.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/cases/${caseItem.id}/documents`)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/cases/${caseItem.id}/generate`)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Letter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
