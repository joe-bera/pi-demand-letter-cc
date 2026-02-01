import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FormSectionProps {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Form fields */
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
  /** Collapsible section */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Icon for the section */
  icon?: React.ReactNode;
}

export function FormSection({
  title,
  description,
  children,
  className,
  collapsible = false,
  defaultCollapsed = false,
  icon,
}: FormSectionProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  return (
    <Card className={cn('transition-all duration-200', className)}>
      <CardHeader
        className={cn(
          collapsible && 'cursor-pointer hover:bg-muted/50 transition-colors'
        )}
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {collapsible && (
            <svg
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform duration-200',
                collapsed && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      </CardHeader>
      {(!collapsible || !collapsed) && (
        <CardContent className="animate-fade-in">{children}</CardContent>
      )}
    </Card>
  );
}

interface FormGridProps {
  /** Grid columns on different screen sizes */
  columns?: 1 | 2 | 3 | 4;
  /** Gap between items */
  gap?: 'sm' | 'default' | 'lg';
  /** Children elements */
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
}

export function FormGrid({
  columns = 2,
  gap = 'default',
  children,
  className,
}: FormGridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-3',
    default: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={cn('grid', colClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
}

interface FormActionsProps {
  /** Children (buttons) */
  children: React.ReactNode;
  /** Alignment */
  align?: 'left' | 'center' | 'right' | 'between';
  /** Custom class name */
  className?: string;
  /** Sticky position at bottom */
  sticky?: boolean;
}

export function FormActions({
  children,
  align = 'right',
  className,
  sticky = false,
}: FormActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 pt-4',
        alignClasses[align],
        sticky && 'sticky bottom-0 bg-background py-4 border-t -mx-4 px-4 sm:-mx-6 sm:px-6',
        className
      )}
    >
      {children}
    </div>
  );
}
