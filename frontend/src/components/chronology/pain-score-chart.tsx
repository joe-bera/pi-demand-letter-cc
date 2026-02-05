'use client';

import { useMemo } from 'react';
import { MedicalEvent, PainScoreEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface PainScoreChartProps {
  painHistory: PainScoreEntry[];
  events: MedicalEvent[];
}

export function PainScoreChart({ painHistory, events }: PainScoreChartProps) {
  // Extract pain scores from events if painHistory is empty
  const painData = useMemo(() => {
    if (painHistory.length > 0) {
      return painHistory;
    }

    return events
      .filter((e) => e.vitalSigns?.pain_score !== undefined)
      .map((e) => ({
        date: e.dateOfService.split('T')[0],
        score: e.vitalSigns!.pain_score!,
        provider: e.providerName || e.facilityName,
        notes: e.vitalSigns?.pain_location,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [painHistory, events]);

  const stats = useMemo(() => {
    if (painData.length === 0) return null;

    const scores = painData.map((p) => p.score);
    return {
      max: Math.max(...scores),
      min: Math.min(...scores),
      avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      first: scores[0],
      last: scores[scores.length - 1],
    };
  }, [painData]);

  if (painData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pain Score History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No pain scores recorded in medical records</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate chart dimensions
  const chartHeight = 200;
  const chartWidth = '100%';
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };

  // Create SVG path for the line chart
  const maxScore = 10;
  const points = painData.map((p, i) => {
    const x = (i / (painData.length - 1 || 1)) * 100;
    const y = ((maxScore - p.score) / maxScore) * 100;
    return { x, y, ...p };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`)
    .join(' ');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pain Score History</CardTitle>
          <div className="flex gap-4 text-sm">
            {stats && (
              <>
                <div>
                  <span className="text-muted-foreground">Avg:</span>{' '}
                  <span className="font-medium">{stats.avg}/10</span>
                </div>
                <div>
                  <span className="text-muted-foreground">High:</span>{' '}
                  <span className="font-medium text-red-600">{stats.max}/10</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Low:</span>{' '}
                  <span className="font-medium text-green-600">{stats.min}/10</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Simple SVG Chart */}
        <div className="relative" style={{ height: chartHeight }}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            {/* Grid lines */}
            {[0, 2, 4, 6, 8, 10].map((score) => (
              <g key={score}>
                <line
                  x1="0%"
                  y1={`${(10 - score) * 10}%`}
                  x2="100%"
                  y2={`${(10 - score) * 10}%`}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeWidth={0.5}
                />
                <text
                  x="-2%"
                  y={`${(10 - score) * 10}%`}
                  fill="currentColor"
                  fontSize="3"
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-muted-foreground"
                >
                  {score}
                </text>
              </g>
            ))}

            {/* Area fill */}
            <path
              d={`${pathD} L 100% 100% L 0% 100% Z`}
              fill="url(#painGradient)"
              opacity={0.2}
            />

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />

            {/* Points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={`${p.x}%`}
                cy={`${p.y}%`}
                r={1.5}
                fill="hsl(var(--primary))"
                className="cursor-pointer hover:r-2"
              >
                <title>
                  {formatDate(p.date)}: {p.score}/10
                  {p.provider && ` - ${p.provider}`}
                </title>
              </circle>
            ))}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="painGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Date labels */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatDate(painData[0].date)}</span>
          <span>{formatDate(painData[painData.length - 1].date)}</span>
        </div>

        {/* Pain Score Legend */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm font-medium mb-3">Pain Score History</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {painData.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-1"
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-24">
                    {formatDate(p.date)}
                  </span>
                  <span>{p.provider || 'Provider'}</span>
                </div>
                <Badge
                  variant={
                    p.score >= 7 ? 'destructive' : p.score >= 4 ? 'default' : 'secondary'
                  }
                >
                  {p.score}/10
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Trend Analysis */}
        {stats && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Trend Analysis:</span>{' '}
              {stats.last > stats.first ? (
                <span className="text-red-600">
                  Pain increased from {stats.first}/10 to {stats.last}/10
                </span>
              ) : stats.last < stats.first ? (
                <span className="text-green-600">
                  Pain decreased from {stats.first}/10 to {stats.last}/10
                </span>
              ) : (
                <span>Pain remained at {stats.first}/10</span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
