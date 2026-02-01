import * as React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon to display */
  icon?: LucideIcon;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button or other content */
  action?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
}

function EmptyState({
  className,
  icon: Icon,
  title,
  description,
  action,
  size = 'default',
  ...props
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'h-8 w-8',
      title: 'text-sm',
      description: 'text-xs',
    },
    default: {
      container: 'py-12',
      icon: 'h-12 w-12',
      title: 'text-base',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'h-16 w-16',
      title: 'text-lg',
      description: 'text-base',
    },
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses[size].container,
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-3">
          <Icon
            className={cn('text-muted-foreground', sizeClasses[size].icon)}
          />
        </div>
      )}
      <h3
        className={cn(
          'font-semibold text-foreground',
          sizeClasses[size].title
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'mt-1.5 max-w-sm text-muted-foreground',
            sizeClasses[size].description
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export { EmptyState };
