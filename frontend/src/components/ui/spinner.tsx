import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg';
  /** Show with label */
  label?: string;
}

function Spinner({ size = 'default', label, className, ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn('flex items-center justify-center gap-2', className)}
      {...props}
    >
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

function FullPageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
    </div>
  );
}

function InlineSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('h-4 w-4 animate-spin text-current', className)}
    />
  );
}

export { Spinner, FullPageSpinner, InlineSpinner };
