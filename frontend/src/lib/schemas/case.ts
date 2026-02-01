import { z } from 'zod';

// Incident types enum
export const incidentTypes = [
  { value: 'auto_accident', label: 'Auto Accident' },
  { value: 'slip_and_fall', label: 'Slip and Fall' },
  { value: 'workplace_injury', label: 'Workplace Injury' },
  { value: 'medical_malpractice', label: 'Medical Malpractice' },
  { value: 'product_liability', label: 'Product Liability' },
  { value: 'dog_bite', label: 'Dog Bite' },
  { value: 'premises_liability', label: 'Premises Liability' },
  { value: 'other', label: 'Other' },
] as const;

// US States for jurisdiction
export const jurisdictions = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
] as const;

// Phone number regex (US format)
const phoneRegex = /^(\+1)?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

// Create case schema
export const createCaseSchema = z.object({
  // Client Information
  clientFirstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less'),
  clientLastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less'),
  clientEmail: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  clientPhone: z
    .string()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  clientDateOfBirth: z.string().optional(),
  clientAddress: z.string().max(200, 'Address must be 200 characters or less').optional(),

  // Incident Information
  incidentDate: z
    .string()
    .min(1, 'Incident date is required')
    .refine((date) => {
      const incidentDate = new Date(date);
      const today = new Date();
      return incidentDate <= today;
    }, 'Incident date cannot be in the future'),
  incidentType: z.enum(
    incidentTypes.map((t) => t.value) as [string, ...string[]],
    { required_error: 'Please select an incident type' }
  ),
  incidentLocation: z
    .string()
    .max(200, 'Location must be 200 characters or less')
    .optional(),
  incidentDescription: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional(),

  // Defendant/Insurance Information
  defendantName: z
    .string()
    .max(100, 'Defendant name must be 100 characters or less')
    .optional(),
  defendantInsuranceCompany: z
    .string()
    .max(100, 'Insurance company name must be 100 characters or less')
    .optional(),
  claimNumber: z
    .string()
    .max(50, 'Claim number must be 50 characters or less')
    .optional(),
  jurisdiction: z.enum(
    jurisdictions.map((j) => j.value) as [string, ...string[]],
    { required_error: 'Please select a jurisdiction' }
  ),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;

// Update case schema (all fields optional except required ones)
export const updateCaseSchema = createCaseSchema.partial();

export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;

// Case filter schema (for search/filtering)
export const caseFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  incidentType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type CaseFilterInput = z.infer<typeof caseFilterSchema>;
