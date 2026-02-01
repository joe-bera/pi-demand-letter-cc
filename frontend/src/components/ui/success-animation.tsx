'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, PartyPopper, Sparkles } from 'lucide-react';

interface SuccessAnimationProps {
  show: boolean;
  title?: string;
  description?: string;
  onComplete?: () => void;
  duration?: number;
  variant?: 'check' | 'celebration' | 'sparkles';
  className?: string;
}

export function SuccessAnimation({
  show,
  title = 'Success!',
  description,
  onComplete,
  duration = 2000,
  variant = 'check',
  className,
}: SuccessAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!visible) return null;

  const Icon = {
    check: CheckCircle2,
    celebration: PartyPopper,
    sparkles: Sparkles,
  }[variant];

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in',
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 animate-scale-in">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
            <Icon className="h-10 w-10 text-success animate-bounce" />
          </div>
          {/* Confetti dots */}
          {variant === 'celebration' && (
            <>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-2 w-2 rounded-full animate-ping"
                  style={{
                    backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'][i % 4],
                    top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                    left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                    animationDelay: `${i * 100}ms`,
                    animationDuration: '1s',
                  }}
                />
              ))}
            </>
          )}
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold">{title}</h3>
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline success checkmark
export function InlineSuccess({
  show,
  className,
}: {
  show: boolean;
  className?: string;
}) {
  if (!show) return null;

  return (
    <span className={cn('inline-flex animate-scale-in', className)}>
      <CheckCircle2 className="h-4 w-4 text-success" />
    </span>
  );
}
