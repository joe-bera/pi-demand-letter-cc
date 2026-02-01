'use client';

import { cn } from '@/lib/utils';

interface LoadingDotsProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function LoadingDots({ size = 'default', className }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'h-1 w-1',
    default: 'h-1.5 w-1.5',
    lg: 'h-2 w-2',
  };

  const gapClasses = {
    sm: 'gap-0.5',
    default: 'gap-1',
    lg: 'gap-1.5',
  };

  return (
    <span className={cn('inline-flex items-center', gapClasses[size], className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            'rounded-full bg-current animate-pulse',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: '1s',
          }}
        />
      ))}
    </span>
  );
}

// Typing indicator style
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-sm text-muted-foreground">Typing</span>
      <LoadingDots size="sm" className="text-muted-foreground" />
    </div>
  );
}

// Thinking indicator for AI
export function ThinkingIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground',
        className
      )}
    >
      <span className="inline-flex">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>
          .
        </span>
        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>
          .
        </span>
        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>
          .
        </span>
      </span>
      <span>AI is thinking</span>
    </div>
  );
}
