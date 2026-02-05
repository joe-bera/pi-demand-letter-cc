'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProviderSummary } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { Building2, DollarSign } from 'lucide-react';

interface CostBreakdownProps {
  caseId: string;
  providersSummary?: ProviderSummary[];
  totalCosts: number;
}

interface CostData {
  totalCosts: number;
  byProviderType: Array<{ type: string; amount: number }>;
  byProvider: Array<{ provider: string; amount: number }>;
  events: Array<{
    date: string;
    provider?: string;
    type?: string;
    charge: number;
    paid: number;
    balance: number;
  }>;
}

export function CostBreakdown({
  caseId,
  providersSummary,
  totalCosts,
}: CostBreakdownProps) {
  const { data: costData, isLoading } = useQuery({
    queryKey: ['costs', caseId],
    queryFn: async () => {
      const response = await api.get<CostData>(`/cases/${caseId}/chronology/costs`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const byType = costData?.byProviderType || [];
  const byProvider = costData?.byProvider || providersSummary?.map((p) => ({
    provider: p.name,
    amount: p.totalCost,
  })) || [];

  const maxTypeAmount = Math.max(...byType.map((t) => t.amount), 1);
  const maxProviderAmount = Math.max(...byProvider.map((p) => p.amount), 1);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* By Provider Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Costs by Provider Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {byType.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No cost data available
            </p>
          ) : (
            <div className="space-y-4">
              {byType.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.type}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                  <Progress
                    value={(item.amount / maxTypeAmount) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* By Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Costs by Provider
          </CardTitle>
        </CardHeader>
        <CardContent>
          {byProvider.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No cost data available
            </p>
          ) : (
            <div className="space-y-4">
              {byProvider.slice(0, 10).map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate max-w-[200px]">{item.provider}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                  <Progress
                    value={(item.amount / maxProviderAmount) * 100}
                    className="h-2"
                  />
                </div>
              ))}
              {byProvider.length > 10 && (
                <p className="text-sm text-muted-foreground">
                  +{byProvider.length - 10} more providers
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Summary */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Medical Expenses Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Billed</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(costData?.totalCosts || totalCosts)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Insurance Paid</p>
              <p className="text-3xl font-bold mt-1 text-green-700">
                {formatCurrency(
                  costData?.events?.reduce((sum, e) => sum + e.paid, 0) || 0
                )}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">Patient Responsibility</p>
              <p className="text-3xl font-bold mt-1 text-red-700">
                {formatCurrency(
                  costData?.events?.reduce((sum, e) => sum + e.balance, 0) || 0
                )}
              </p>
            </div>
          </div>

          {/* Note for attorneys */}
          <div className="mt-6 p-4 border rounded-lg bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These figures represent extracted medical billing
              data. Verify against original bills before including in demand letter.
              Consider future medical costs based on prognosis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
