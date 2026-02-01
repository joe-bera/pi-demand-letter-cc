import { cn } from '@/lib/utils';
import { Breadcrumbs } from './breadcrumbs';

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional actions (buttons, etc.) */
  actions?: React.ReactNode;
  /** Show breadcrumbs */
  showBreadcrumbs?: boolean;
  /** Custom breadcrumb items */
  breadcrumbItems?: { label: string; href?: string }[];
  /** Custom class name */
  className?: string;
  /** Children to render below header */
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  showBreadcrumbs = true,
  breadcrumbItems,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {showBreadcrumbs && <Breadcrumbs items={breadcrumbItems} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
      {children}
    </div>
  );
}

interface PageHeaderSkeletonProps {
  showBreadcrumbs?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
  className?: string;
}

export function PageHeaderSkeleton({
  showBreadcrumbs = true,
  showDescription = true,
  showActions = false,
  className,
}: PageHeaderSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {showBreadcrumbs && (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted animate-pulse" />
          <div className="h-4 w-4 rounded bg-muted animate-pulse" />
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          <div className="h-4 w-4 rounded bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-muted animate-pulse" />
          {showDescription && (
            <div className="h-4 w-64 rounded bg-muted animate-pulse" />
          )}
        </div>
        {showActions && (
          <div className="flex items-center gap-2">
            <div className="h-10 w-24 rounded bg-muted animate-pulse" />
            <div className="h-10 w-32 rounded bg-muted animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
