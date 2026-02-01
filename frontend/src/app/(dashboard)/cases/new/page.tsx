'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { FormField } from '@/components/forms/form-field';
import { FormSection, FormGrid, FormActions } from '@/components/forms/form-section';
import {
  createCaseSchema,
  type CreateCaseInput,
  incidentTypes,
  jurisdictions,
} from '@/lib/schemas/case';
import { User, Car, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { z } from 'zod';

type FormErrors = Partial<Record<keyof CreateCaseInput, string>>;

interface CaseCreateResponse {
  success: boolean;
  data: { id: string };
}

export default function NewCasePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateCaseInput>({
    clientFirstName: '',
    clientLastName: '',
    clientEmail: '',
    clientPhone: '',
    incidentDate: '',
    incidentType: 'auto_accident',
    incidentLocation: '',
    incidentDescription: '',
    defendantName: '',
    defendantInsuranceCompany: '',
    claimNumber: '',
    jurisdiction: 'CA',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const createCase = useMutation<CaseCreateResponse, Error, CreateCaseInput>({
    mutationFn: (data: CreateCaseInput) =>
      api.post<{ id: string }>('/cases', {
        ...data,
        incidentDate: new Date(data.incidentDate).toISOString(),
      }),
    onSuccess: (response: CaseCreateResponse) => {
      toast.success('Case created successfully!', {
        description: 'You can now upload documents.',
      });
      router.push(`/cases/${response.data.id}`);
    },
    onError: (error: Error) => {
      toast.error('Failed to create case', {
        description: error.message || 'Please try again.',
      });
    },
  });

  const validateField = useCallback(
    (name: keyof CreateCaseInput, value: string) => {
      try {
        const fieldSchema = createCaseSchema.shape[name];
        fieldSchema.parse(value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          setErrors((prev) => ({
            ...prev,
            [name]: err.errors[0]?.message,
          }));
        }
      }
    },
    []
  );

  const handleChange = useCallback(
    (name: keyof CreateCaseInput, value: string) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setTouched((prev) => new Set(prev).add(name));
      validateField(name, value);
    },
    [validateField]
  );

  const validateForm = (): boolean => {
    try {
      createCaseSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        err.errors.forEach((error) => {
          const field = error.path[0] as keyof CreateCaseInput;
          if (!newErrors[field]) {
            newErrors[field] = error.message;
          }
        });
        setErrors(newErrors);
        // Mark all error fields as touched
        setTouched((prev) => {
          const newTouched = new Set(prev);
          Object.keys(newErrors).forEach((key) => newTouched.add(key));
          return newTouched;
        });
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createCase.mutate(formData);
    } else {
      toast.error('Please fix the errors before submitting');
    }
  };

  const getFieldError = (name: keyof CreateCaseInput): string | undefined => {
    return touched.has(name) ? errors[name] : undefined;
  };

  return (
    <div className="max-w-3xl mx-auto pb-8">
      <PageHeader
        title="Create New Case"
        description="Enter the case information to get started. Required fields are marked with an asterisk."
        showBreadcrumbs
      />

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Client Information */}
        <FormSection
          title="Client Information"
          description="Basic contact details for your client"
          icon={<User className="h-5 w-5" />}
        >
          <FormGrid columns={2}>
            <FormField
              name="clientFirstName"
              label="First Name"
              type="text"
              required
              value={formData.clientFirstName}
              onChange={(value) => handleChange('clientFirstName', value)}
              error={getFieldError('clientFirstName')}
              inputProps={{ placeholder: 'John' }}
            />
            <FormField
              name="clientLastName"
              label="Last Name"
              type="text"
              required
              value={formData.clientLastName}
              onChange={(value) => handleChange('clientLastName', value)}
              error={getFieldError('clientLastName')}
              inputProps={{ placeholder: 'Doe' }}
            />
            <FormField
              name="clientEmail"
              label="Email"
              type="email"
              optional
              value={formData.clientEmail}
              onChange={(value) => handleChange('clientEmail', value)}
              error={getFieldError('clientEmail')}
              inputProps={{ placeholder: 'john@example.com' }}
            />
            <FormField
              name="clientPhone"
              label="Phone"
              type="tel"
              optional
              value={formData.clientPhone}
              onChange={(value) => handleChange('clientPhone', value)}
              error={getFieldError('clientPhone')}
              inputProps={{ placeholder: '(555) 123-4567' }}
              helpText="US phone number format"
            />
          </FormGrid>
        </FormSection>

        {/* Incident Information */}
        <FormSection
          title="Incident Information"
          description="Details about the accident or injury"
          icon={<Car className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <FormGrid columns={2}>
              <FormField
                name="incidentDate"
                label="Incident Date"
                type="date"
                required
                value={formData.incidentDate}
                onChange={(value) => handleChange('incidentDate', value)}
                error={getFieldError('incidentDate')}
              />
              <FormField
                name="incidentType"
                label="Incident Type"
                type="select"
                required
                value={formData.incidentType}
                onChange={(value) => handleChange('incidentType', value)}
                error={getFieldError('incidentType')}
                options={incidentTypes.map((t) => ({
                  value: t.value,
                  label: t.label,
                }))}
              />
            </FormGrid>
            <FormField
              name="incidentLocation"
              label="Incident Location"
              type="text"
              optional
              value={formData.incidentLocation}
              onChange={(value) => handleChange('incidentLocation', value)}
              error={getFieldError('incidentLocation')}
              inputProps={{ placeholder: 'Address or intersection' }}
            />
            <FormField
              name="incidentDescription"
              label="Incident Description"
              type="textarea"
              optional
              value={formData.incidentDescription}
              onChange={(value) => handleChange('incidentDescription', value)}
              error={getFieldError('incidentDescription')}
              textareaProps={{
                placeholder: 'Brief description of what happened...',
                rows: 4,
                showCount: true,
                maxLength: 2000,
              }}
            />
          </div>
        </FormSection>

        {/* Defendant/Insurance Information */}
        <FormSection
          title="Defendant & Insurance"
          description="Information about the at-fault party and their insurance"
          icon={<Building2 className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <FormField
              name="defendantName"
              label="Defendant Name"
              type="text"
              optional
              value={formData.defendantName}
              onChange={(value) => handleChange('defendantName', value)}
              error={getFieldError('defendantName')}
              inputProps={{ placeholder: 'Name of the at-fault party' }}
            />
            <FormGrid columns={2}>
              <FormField
                name="defendantInsuranceCompany"
                label="Insurance Company"
                type="text"
                optional
                value={formData.defendantInsuranceCompany}
                onChange={(value) =>
                  handleChange('defendantInsuranceCompany', value)
                }
                error={getFieldError('defendantInsuranceCompany')}
                inputProps={{ placeholder: 'e.g., State Farm' }}
              />
              <FormField
                name="claimNumber"
                label="Claim Number"
                type="text"
                optional
                value={formData.claimNumber}
                onChange={(value) => handleChange('claimNumber', value)}
                error={getFieldError('claimNumber')}
                inputProps={{ placeholder: 'Insurance claim number' }}
              />
            </FormGrid>
            <FormField
              name="jurisdiction"
              label="Jurisdiction"
              type="select"
              required
              value={formData.jurisdiction}
              onChange={(value) => handleChange('jurisdiction', value)}
              error={getFieldError('jurisdiction')}
              options={jurisdictions.map((j) => ({
                value: j.value,
                label: j.label,
              }))}
              helpText="State where the incident occurred"
            />
          </div>
        </FormSection>

        {/* Form Actions */}
        <FormActions align="between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createCase.isPending}
            className="min-w-[140px]"
          >
            {createCase.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Case
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
