'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Search, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { Case } from '@/types';
import { formatDate } from '@/lib/utils';

export default function CasesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.get<Case[]>('/cases'),
  });

  const cases = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
          <p className="text-gray-600">Manage your personal injury cases</p>
        </div>
        <Link
          href="/cases/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Case
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cases..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No cases found. Create your first case to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {cases.map((caseItem) => (
              <Link
                key={caseItem.id}
                href={`/cases/${caseItem.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {caseItem.clientFirstName} {caseItem.clientLastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Incident: {formatDate(caseItem.incidentDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={caseItem.status} />
                    <p className="text-sm text-gray-500 mt-1">
                      {caseItem._count?.documents || 0} documents
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    INTAKE: { label: 'Intake', className: 'bg-gray-100 text-gray-800' },
    DOCUMENTS_UPLOADED: { label: 'Documents Uploaded', className: 'bg-blue-100 text-blue-800' },
    PROCESSING: { label: 'Processing', className: 'bg-yellow-100 text-yellow-800' },
    EXTRACTION_COMPLETE: { label: 'Extracted', className: 'bg-indigo-100 text-indigo-800' },
    DRAFT_READY: { label: 'Draft Ready', className: 'bg-green-100 text-green-800' },
    UNDER_REVIEW: { label: 'Under Review', className: 'bg-purple-100 text-purple-800' },
    SENT: { label: 'Sent', className: 'bg-teal-100 text-teal-800' },
    SETTLED: { label: 'Settled', className: 'bg-emerald-100 text-emerald-800' },
    CLOSED: { label: 'Closed', className: 'bg-gray-100 text-gray-800' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
