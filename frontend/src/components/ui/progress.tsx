'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Current progress value (0-100) */
  value?: number;
  /** Show indeterminate animation when value is undefined */
  indeterminate?: boolean;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  /** Show value label */
  showValue?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value = 0,
      indeterminate = false,
      size = 'default',
      variant = 'default',
      showValue = false,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-1',
      default: 'h-2',
      lg: 'h-3',
    };

    const variantClasses = {
      default: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
    };

    return (
      <div className="w-full">
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            'relative w-full overflow-hidden rounded-full bg-secondary',
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              'h-full flex-1 transition-all duration-300 ease-out',
              variantClasses[variant],
              indeterminate && 'w-1/4 animate-progress-indeterminate'
            )}
            style={
              indeterminate
                ? undefined
                : { transform: `translateX(-${100 - (value || 0)}%)` }
            }
          />
        </ProgressPrimitive.Root>
        {showValue && !indeterminate && (
          <span className="mt-1 text-xs text-muted-foreground">
            {Math.round(value || 0)}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

interface ProgressWithLabelProps extends ProgressProps {
  label?: string;
}

const ProgressWithLabel = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressWithLabelProps
>(({ label, value, className, ...props }, ref) => (
  <div className={cn('space-y-1.5', className)}>
    <div className="flex items-center justify-between text-sm">
      {label && <span className="font-medium">{label}</span>}
      <span className="text-muted-foreground">{Math.round(value || 0)}%</span>
    </div>
    <Progress ref={ref} value={value} {...props} />
  </div>
));
ProgressWithLabel.displayName = 'ProgressWithLabel';

export { Progress, ProgressWithLabel };
