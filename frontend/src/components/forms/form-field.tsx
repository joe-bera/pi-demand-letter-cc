'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input, type InputProps } from '@/components/ui/input';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface FormFieldBaseProps {
  /** Field name for form handling */
  name: string;
  /** Label text */
  label: string;
  /** Help text shown below the field */
  helpText?: string;
  /** Error message */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Optional field indicator */
  optional?: boolean;
  /** Show success state */
  success?: boolean;
  /** Custom class name */
  className?: string;
}

interface FormFieldInputProps extends FormFieldBaseProps {
  type: 'text' | 'email' | 'tel' | 'password' | 'number' | 'date' | 'url';
  inputProps?: Omit<InputProps, 'error'>;
  value?: string;
  onChange?: (value: string) => void;
}

interface FormFieldTextareaProps extends FormFieldBaseProps {
  type: 'textarea';
  textareaProps?: Omit<TextareaProps, 'error'>;
  value?: string;
  onChange?: (value: string) => void;
}

interface FormFieldSelectProps extends FormFieldBaseProps {
  type: 'select';
  options: { value: string; label: string }[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export type FormFieldProps =
  | FormFieldInputProps
  | FormFieldTextareaProps
  | FormFieldSelectProps;

export function FormField(props: FormFieldProps) {
  const {
    name,
    label,
    helpText,
    error,
    required,
    optional,
    success,
    className,
    type,
    value,
    onChange,
  } = props;

  const id = `field-${name}`;
  const hasError = !!error;

  const renderField = () => {
    switch (type) {
      case 'textarea': {
        const { textareaProps } = props as FormFieldTextareaProps;
        return (
          <Textarea
            id={id}
            name={name}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            error={hasError}
            errorMessage={error}
            aria-invalid={hasError}
            aria-describedby={helpText ? `${id}-help` : undefined}
            {...textareaProps}
          />
        );
      }
      case 'select': {
        const { options, placeholder } = props as FormFieldSelectProps;
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger error={hasError}>
              <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      default: {
        const { inputProps } = props as FormFieldInputProps;
        return (
          <Input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            error={hasError}
            aria-invalid={hasError}
            aria-describedby={helpText ? `${id}-help` : undefined}
            rightIcon={
              success && !hasError ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : undefined
            }
            {...inputProps}
          />
        );
      }
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} required={required} optional={optional}>
        {label}
      </Label>
      {renderField()}
      {type === 'select' && hasError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {helpText && !hasError && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
    </div>
  );
}

// Simple hook for form field state management
export function useFormField<T extends string>(initialValue: T = '' as T) {
  const [value, setValue] = React.useState<T>(initialValue);
  const [error, setError] = React.useState<string>();
  const [touched, setTouched] = React.useState(false);

  const handleChange = React.useCallback((newValue: T) => {
    setValue(newValue);
    if (error) setError(undefined);
  }, [error]);

  const handleBlur = React.useCallback(() => {
    setTouched(true);
  }, []);

  const reset = React.useCallback(() => {
    setValue(initialValue);
    setError(undefined);
    setTouched(false);
  }, [initialValue]);

  return {
    value,
    error,
    touched,
    setValue: handleChange,
    setError,
    onBlur: handleBlur,
    reset,
    props: {
      value,
      onChange: handleChange,
      error: touched ? error : undefined,
    },
  };
}
