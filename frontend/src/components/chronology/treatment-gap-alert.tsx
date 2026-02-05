'use client';

import { TreatmentGap } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TreatmentGapAlertProps {
  gaps: TreatmentGap[];
}

export function TreatmentGapAlert({ gaps }: TreatmentGapAlertProps) {
  if (gaps.length === 0) return null;

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'low':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-orange-100 border-orange-300 text-orange-800';
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Treatment Gaps Detected ({gaps.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-orange-700 mb-4">
          The following gaps in treatment may be questioned by the insurance company.
          Review the suggested explanations below.
        </p>
        <div className="space-y-3">
          {gaps.map((gap, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getImpactColor(gap.impact)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {formatDate(gap.startDate)} — {formatDate(gap.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Badge variant="secondary">{gap.durationDays} days</Badge>
                  {gap.impact && (
                    <Badge
                      variant={
                        gap.impact === 'high'
                          ? 'destructive'
                          : gap.impact === 'medium'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {gap.impact} impact
                    </Badge>
                  )}
                </div>
              </div>
              {gap.explanation && (
                <div className="mt-3">
                  <p className="text-sm font-medium">Suggested Explanation:</p>
                  <p className="text-sm mt-1">{gap.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-white rounded-lg border border-orange-200">
          <p className="text-sm">
            <strong>Attorney Note:</strong> Treatment gaps are common and can often be
            explained by financial constraints, work obligations, symptom improvement,
            or delayed onset of symptoms. Consider addressing these proactively in the
            demand letter.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
