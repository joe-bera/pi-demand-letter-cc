'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import { Warning } from '@/types';

interface WarningPanelProps {
  warnings: Warning[];
  className?: string;
}


export function WarningPanel({ warnings, className }: WarningPanelProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  if (warnings.length === 0) return null;

  const criticalCount = warnings.filter((w) => w.severity === 'critical').length;
  const moderateCount = warnings.filter((w) => w.severity === 'moderate').length;
  const minorCount = warnings.filter((w) => w.severity === 'minor').length;

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const getSeverityStyles = (severity: Warning['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertCircle,
          bgColor: 'bg-destructive/10',
          textColor: 'text-destructive',
          borderColor: 'border-destructive/20',
          badgeVariant: 'destructive' as const,
        };
      case 'moderate':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-warning/10',
          textColor: 'text-warning',
          borderColor: 'border-warning/20',
          badgeVariant: 'warning' as const,
        };
      case 'minor':
        return {
          icon: Info,
          bgColor: 'bg-muted',
          textColor: 'text-muted-foreground',
          borderColor: 'border-border',
          badgeVariant: 'secondary' as const,
        };
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Warnings & Recommendations
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" size="sm">
                {criticalCount} Critical
              </Badge>
            )}
            {moderateCount > 0 && (
              <Badge variant="warning" size="sm">
                {moderateCount} Moderate
              </Badge>
            )}
            {minorCount > 0 && (
              <Badge variant="secondary" size="sm">
                {minorCount} Minor
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {warnings.map((warning, index) => {
          const styles = getSeverityStyles(warning.severity);
          const Icon = styles.icon;
          const isExpanded = expandedItems.has(index);

          return (
            <div
              key={index}
              className={cn(
                'rounded-lg border transition-colors',
                styles.borderColor,
                isExpanded && styles.bgColor
              )}
            >
              <button
                className="flex w-full items-start gap-3 p-3 text-left"
                onClick={() => toggleItem(index)}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                    styles.bgColor
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', styles.textColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={styles.badgeVariant} size="sm">
                      {warning.category}
                    </Badge>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    )}
                  </div>
                  <p className={cn('text-sm mt-1', !isExpanded && 'line-clamp-1')}>
                    {warning.message}
                  </p>
                </div>
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 pt-0">
                  <div
                    className={cn(
                      'flex items-start gap-2 rounded-md p-2 ml-9',
                      'bg-background border'
                    )}
                  >
                    <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-primary">
                        Recommendation
                      </span>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {warning.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
