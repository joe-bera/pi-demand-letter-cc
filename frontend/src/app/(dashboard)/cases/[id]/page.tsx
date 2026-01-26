'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Upload,
  Sparkles,
  Download,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Case } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: () => api.get<Case>(`/cases/${id}`),
  });

  const caseData = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading case...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Case not found</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/cases"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cases
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {caseData.clientFirstName} {caseData.clientLastName}
            </h1>
            <p className="text-gray-600">
              {caseData.incidentType.replace('_', ' ')} - {formatDate(caseData.incidentDate)}
            </p>
          </div>
          <StatusBadge status={caseData.status} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link
          href={`/cases/${id}/documents`}
          className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-blue-100 rounded-lg mr-4">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium">Upload Documents</h3>
            <p className="text-sm text-gray-500">
              {caseData._count?.documents || 0} documents
            </p>
          </div>
        </Link>

        <Link
          href={`/cases/${id}/generate`}
          className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-purple-100 rounded-lg mr-4">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium">Generate Letter</h3>
            <p className="text-sm text-gray-500">AI-powered generation</p>
          </div>
        </Link>

        <button className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-100 rounded-lg mr-4">
            <Download className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-left">
            <h3 className="font-medium">Export</h3>
            <p className="text-sm text-gray-500">Word or PDF</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Case Details */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Case Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Client Name</dt>
                <dd className="font-medium">
                  {caseData.clientFirstName} {caseData.clientLastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Incident Date</dt>
                <dd className="font-medium">{formatDate(caseData.incidentDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Incident Type</dt>
                <dd className="font-medium capitalize">
                  {caseData.incidentType.replace('_', ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Location</dt>
                <dd className="font-medium">{caseData.incidentLocation || 'Not specified'}</dd>
              </div>
              {caseData.defendantInsuranceCompany && (
                <div>
                  <dt className="text-sm text-gray-500">Insurance Company</dt>
                  <dd className="font-medium">{caseData.defendantInsuranceCompany}</dd>
                </div>
              )}
              {caseData.claimNumber && (
                <div>
                  <dt className="text-sm text-gray-500">Claim Number</dt>
                  <dd className="font-medium">{caseData.claimNumber}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Documents</h2>
              <Link
                href={`/cases/${id}/documents`}
                className="text-blue-600 hover:underline text-sm"
              >
                Manage Documents
              </Link>
            </div>
            {(caseData._count?.documents || 0) === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No documents uploaded yet</p>
                <Link
                  href={`/cases/${id}/documents`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Upload documents
                </Link>
              </div>
            ) : (
              <p className="text-gray-600">
                {caseData._count?.documents} documents uploaded
              </p>
            )}
          </div>

          {/* Generated Letters */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Generated Documents</h2>
              <Link
                href={`/cases/${id}/generate`}
                className="text-blue-600 hover:underline text-sm"
              >
                Generate New
              </Link>
            </div>
            {(caseData._count?.generatedDocuments || 0) === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No documents generated yet</p>
                <Link
                  href={`/cases/${id}/generate`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Generate demand letter
                </Link>
              </div>
            ) : (
              <p className="text-gray-600">
                {caseData._count?.generatedDocuments} documents generated
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Damages Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Damages Summary</h2>
            {caseData.damagesCalculation ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Medical Bills</span>
                  <span className="font-medium">
                    {formatCurrency(
                      (caseData.damagesCalculation as { specialDamages?: { medicalBills?: number } })
                        .specialDamages?.medicalBills || 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Wage Loss</span>
                  <span className="font-medium">
                    {formatCurrency(
                      (caseData.damagesCalculation as { specialDamages?: { wageLoss?: number } })
                        .specialDamages?.wageLoss || 0
                    )}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-medium">Total Special Damages</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(
                      (caseData.damagesCalculation as { specialDamages?: { total?: number } })
                        .specialDamages?.total || 0
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Upload and process documents to calculate damages
              </p>
            )}
          </div>

          {/* Warnings */}
          {caseData.attorneyWarnings && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                Warnings
              </h2>
              <ul className="space-y-2">
                {(caseData.attorneyWarnings as Array<{ message: string; severity: string }>).map(
                  (warning, index) => (
                    <li
                      key={index}
                      className={`text-sm p-2 rounded ${
                        warning.severity === 'critical'
                          ? 'bg-red-50 text-red-800'
                          : warning.severity === 'moderate'
                          ? 'bg-yellow-50 text-yellow-800'
                          : 'bg-gray-50 text-gray-800'
                      }`}
                    >
                      {warning.message}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
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
    SENT: { label: 'Sent', className: 'bg-teal-100 text-teal-800' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
