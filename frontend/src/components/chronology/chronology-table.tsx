'use client';

import { useState, useMemo } from 'react';
import { MedicalEvent } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ArrowUpDown, Download } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ChronologyTableProps {
  events: MedicalEvent[];
}

type SortField = 'dateOfService' | 'providerName' | 'totalCharge';
type SortOrder = 'asc' | 'desc';

export function ChronologyTable({ events }: ChronologyTableProps) {
  const [search, setSearch] = useState('');
  const [providerTypeFilter, setProviderTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('dateOfService');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Get unique provider types
  const providerTypes = useMemo(() => {
    const types = new Set<string>();
    events.forEach((e) => {
      if (e.providerType) types.add(e.providerType);
    });
    return Array.from(types).sort();
  }, [events]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.providerName?.toLowerCase().includes(searchLower) ||
          e.facilityName?.toLowerCase().includes(searchLower) ||
          e.chiefComplaint?.toLowerCase().includes(searchLower) ||
          e.diagnoses?.some((d) =>
            d.diagnosis_name.toLowerCase().includes(searchLower)
          )
      );
    }

    // Provider type filter
    if (providerTypeFilter !== 'all') {
      filtered = filtered.filter((e) => e.providerType === providerTypeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'dateOfService') {
        comparison =
          new Date(a.dateOfService).getTime() -
          new Date(b.dateOfService).getTime();
      } else if (sortField === 'providerName') {
        comparison = (a.providerName || '').localeCompare(b.providerName || '');
      } else if (sortField === 'totalCharge') {
        comparison = (a.totalCharge || 0) - (b.totalCharge || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [events, search, providerTypeFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const totalCosts = filteredEvents.reduce(
    (sum, e) => sum + (e.totalCharge || 0),
    0
  );

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Provider',
      'Type',
      'Diagnoses',
      'Treatments',
      'Pain Score',
      'Charges',
    ];
    const rows = filteredEvents.map((e) => [
      formatDate(e.dateOfService),
      e.providerName || e.facilityName || '',
      e.providerType || '',
      e.diagnoses?.map((d) => d.diagnosis_name).join('; ') || '',
      e.treatmentsProcedures?.join('; ') || '',
      e.vitalSigns?.pain_score?.toString() || '',
      e.totalCharge?.toString() || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical-chronology.csv';
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Medical Events ({filteredEvents.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search providers, diagnoses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={providerTypeFilter} onValueChange={setProviderTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Provider Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provider Types</SelectItem>
              {providerTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('dateOfService')}
                    className="-ml-3"
                  >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('providerName')}
                    className="-ml-3"
                  >
                    Provider
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Diagnoses</TableHead>
                <TableHead>Pain</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('totalCharge')}
                    className="-mr-3"
                  >
                    Charges
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    {formatDate(event.dateOfService)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {event.providerName || event.facilityName || 'Unknown'}
                      </p>
                      {event.facilityName && event.providerName && (
                        <p className="text-xs text-muted-foreground">
                          {event.facilityName}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{event.providerType || 'Visit'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {event.diagnoses?.slice(0, 2).map((dx, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {dx.diagnosis_name.length > 30
                            ? dx.diagnosis_name.substring(0, 30) + '...'
                            : dx.diagnosis_name}
                        </Badge>
                      ))}
                      {event.diagnoses && event.diagnoses.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{event.diagnoses.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.vitalSigns?.pain_score !== undefined ? (
                      <Badge
                        variant={
                          event.vitalSigns.pain_score >= 7
                            ? 'destructive'
                            : event.vitalSigns.pain_score >= 4
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {event.vitalSigns.pain_score}/10
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {event.totalCharge ? (
                      formatCurrency(event.totalCharge)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Charges</p>
            <p className="text-xl font-bold">{formatCurrency(totalCosts)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
