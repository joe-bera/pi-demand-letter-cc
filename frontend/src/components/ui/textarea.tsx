'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Show character count */
  showCount?: boolean;
  /** Maximum character count */
  maxLength?: number;
  /** Auto-resize based on content */
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      errorMessage,
      showCount,
      maxLength,
      autoResize,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;
    const [charCount, setCharCount] = React.useState(
      props.value?.toString().length || props.defaultValue?.toString().length || 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (showCount) {
        setCharCount(e.target.value.length);
      }

      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }

      onChange?.(e);
    };

    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [autoResize, textareaRef]);

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 resize-none',
            error &&
              'border-destructive focus-visible:ring-destructive/50 bg-destructive/5',
            autoResize && 'overflow-hidden',
            className
          )}
          ref={textareaRef}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />
        {(showCount || error) && (
          <div className="mt-1.5 flex items-center justify-between">
            {error && errorMessage && (
              <p className="text-xs text-destructive">{errorMessage}</p>
            )}
            {showCount && (
              <p
                className={cn(
                  'ml-auto text-xs text-muted-foreground',
                  maxLength && charCount > maxLength * 0.9 && 'text-warning',
                  maxLength && charCount >= maxLength && 'text-destructive'
                )}
              >
                {charCount}
                {maxLength && `/${maxLength}`}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
