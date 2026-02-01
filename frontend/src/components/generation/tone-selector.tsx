'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toneOptions } from '@/hooks/use-generation';
import { Gauge, Flame, Shield, Heart, Check } from 'lucide-react';

interface ToneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const toneIcons = {
  professional: Gauge,
  aggressive: Flame,
  conservative: Shield,
  empathetic: Heart,
};

export function ToneSelector({
  value,
  onChange,
  disabled,
  className,
}: ToneSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-base font-medium">Tone</Label>
      <div className="grid grid-cols-2 gap-3">
        {toneOptions.map((option) => {
          const Icon = toneIcons[option.value as keyof typeof toneIcons];
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={cn(
                'relative flex flex-col items-start rounded-lg border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              )}
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                  isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="mt-3 font-medium">{option.label}</span>
              <span className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Slider version for compact layout
export function ToneSlider({
  value,
  onChange,
  disabled,
  className,
}: ToneSelectorProps) {
  const currentIndex = toneOptions.findIndex((t) => t.value === value);
  const currentOption = toneOptions.find((t) => t.value === value);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Tone</Label>
        <span className="text-sm font-medium text-primary">
          {currentOption?.label}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={toneOptions.length - 1}
          value={currentIndex}
          onChange={(e) => onChange(toneOptions[parseInt(e.target.value)].value)}
          disabled={disabled}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb:bg-primary slider-thumb:h-4 slider-thumb:w-4 slider-thumb:rounded-full"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
              (currentIndex / (toneOptions.length - 1)) * 100
            }%, hsl(var(--muted)) ${
              (currentIndex / (toneOptions.length - 1)) * 100
            }%, hsl(var(--muted)) 100%)`,
          }}
        />
        <div className="flex justify-between mt-1 px-1">
          {toneOptions.map((option) => (
            <span
              key={option.value}
              className={cn(
                'text-xs',
                option.value === value
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {option.label}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{currentOption?.description}</p>
    </div>
  );
}
