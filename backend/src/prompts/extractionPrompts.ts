export const MEDICAL_RECORDS_EXTRACTION_PROMPT = `Extract ALL medical information from these records into structured JSON.

## Required Output Structure

{
  "patient": {
    "name": "Full name",
    "dateOfBirth": "YYYY-MM-DD",
    "medicalRecordNumber": "MRN if present"
  },
  "visits": [
    {
      "date": "YYYY-MM-DD",
      "providerName": "Dr. Name",
      "facilityName": "Hospital/Clinic Name",
      "visitType": "ER/Follow-up/Consultation/etc.",
      "chiefComplaint": "Patient's primary complaint",
      "diagnoses": [
        {
          "icd10Code": "M54.5",
          "description": "Low back pain",
          "isPrimary": true
        }
      ],
      "procedures": [
        {
          "cptCode": "99213",
          "description": "Office visit, established patient"
        }
      ],
      "objectiveFindings": "Physical exam findings, test results",
      "subjectiveComplaints": "Patient-reported symptoms",
      "treatmentProvided": "Description of treatment",
      "medicationsPrescribed": ["Medication 1", "Medication 2"],
      "workRestrictions": "Any work restrictions noted",
      "followUpInstructions": "Follow-up plan"
    }
  ],
  "imagingSummary": [
    {
      "date": "YYYY-MM-DD",
      "type": "MRI/X-ray/CT",
      "bodyPart": "Cervical spine",
      "findings": "Detailed findings",
      "impression": "Radiologist impression"
    }
  ],
  "preExistingConditions": ["List any mentioned pre-existing conditions"],
  "futureTreatmentRecommendations": ["Recommended future treatments"]
}

## Extraction Rules

1. Extract EVERY visit — do not summarize or skip any
2. Use exact dates in YYYY-MM-DD format
3. Include ICD-10 and CPT codes exactly as written
4. Differentiate between objective findings (exam/test results) and subjective complaints (patient reports)
5. Note ALL medications, including dosages if provided
6. Flag any mention of pre-existing conditions
7. Include imaging findings verbatim when possible`;

export const MEDICAL_BILLS_EXTRACTION_PROMPT = `Extract all billing information from these medical bills into structured JSON.

## Required Output Structure

{
  "provider": {
    "name": "Provider/Facility Name",
    "address": "Full address",
    "npi": "NPI number if present",
    "taxId": "Tax ID if present"
  },
  "patient": {
    "name": "Patient name",
    "accountNumber": "Account number"
  },
  "charges": [
    {
      "dateOfService": "YYYY-MM-DD",
      "cptCode": "99213",
      "description": "Service description",
      "quantity": 1,
      "amountBilled": 150.00,
      "insuranceAdjustment": 50.00,
      "insurancePaid": 80.00,
      "patientResponsibility": 20.00,
      "balanceDue": 20.00
    }
  ],
  "summary": {
    "totalBilled": 1500.00,
    "totalAdjustments": 500.00,
    "totalInsurancePaid": 800.00,
    "totalPatientPaid": 100.00,
    "totalDue": 100.00
  },
  "insuranceInfo": {
    "primaryInsurance": "Insurance company name",
    "claimNumber": "Claim number if present"
  }
}

## Extraction Rules

1. Extract EVERY line item charge
2. Use exact dollar amounts — do not round
3. Include CPT codes when available
4. Calculate totals if not provided
5. Note any payment plan or collection status`;

export const POLICE_REPORT_EXTRACTION_PROMPT = `Extract all relevant information from this police/collision report into structured JSON.

## Required Output Structure

{
  "reportInfo": {
    "reportNumber": "Report number",
    "dateOfIncident": "YYYY-MM-DD",
    "timeOfIncident": "HH:MM (24hr)",
    "reportingOfficer": "Officer name/badge",
    "agency": "Police department name"
  },
  "location": {
    "address": "Street address",
    "city": "City",
    "state": "State",
    "intersection": "Cross streets if applicable",
    "roadConditions": "Dry/Wet/etc.",
    "weatherConditions": "Clear/Rain/etc.",
    "lightingConditions": "Daylight/Dark/etc."
  },
  "parties": [
    {
      "role": "Driver 1/Driver 2/Pedestrian/etc.",
      "name": "Full name",
      "dateOfBirth": "YYYY-MM-DD",
      "address": "Address",
      "phone": "Phone number",
      "driversLicense": "DL number",
      "vehicle": {
        "year": "2020",
        "make": "Toyota",
        "model": "Camry",
        "color": "Blue",
        "licensePlate": "Plate number",
        "vin": "VIN if available"
      },
      "insurance": {
        "company": "Insurance company",
        "policyNumber": "Policy number"
      },
      "injuries": "Injury description or 'No apparent injury'",
      "citationsIssued": ["VC 22350 - Speed", "etc."]
    }
  ],
  "narrative": "Officer's narrative description of the incident",
  "faultDetermination": {
    "atFaultParty": "Party determined at fault",
    "violations": ["List of violations"],
    "contributingFactors": ["Speed", "Distraction", "etc."]
  },
  "witnesses": [
    {
      "name": "Witness name",
      "phone": "Phone number",
      "statement": "Brief statement summary"
    }
  ],
  "diagrams": "Description of any diagrams included"
}

## Extraction Rules

1. Extract ALL party information completely
2. Note exact vehicle code violations cited
3. Preserve officer's narrative verbatim if possible
4. Include all witness information
5. Note fault determination if stated`;

export const WAGE_DOCUMENTATION_EXTRACTION_PROMPT = `Extract all wage and employment information from these documents into structured JSON.

## Required Output Structure

{
  "employer": {
    "name": "Company name",
    "address": "Address",
    "phone": "Phone",
    "contactPerson": "HR contact if available"
  },
  "employee": {
    "name": "Employee name",
    "position": "Job title",
    "department": "Department",
    "startDate": "YYYY-MM-DD",
    "employmentType": "Full-time/Part-time/Hourly"
  },
  "compensation": {
    "payType": "Hourly/Salary/Commission",
    "baseRate": 25.00,
    "rateUnit": "hour/week/month/year",
    "averageHoursPerWeek": 40,
    "averageWeeklyGross": 1000.00,
    "averageMonthlyGross": 4333.33,
    "averageAnnualGross": 52000.00
  },
  "payPeriods": [
    {
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "hoursWorked": 80,
      "grossPay": 2000.00,
      "netPay": 1500.00,
      "overtime": 0
    }
  ],
  "missedWork": {
    "totalDaysMissed": 15,
    "startDate": "YYYY-MM-DD",
    "returnDate": "YYYY-MM-DD or 'Not returned'",
    "partialDays": 5
  },
  "wageLoss": {
    "dailyRate": 200.00,
    "totalDaysMissed": 15,
    "totalWageLoss": 3000.00,
    "calculationMethod": "How wage loss was calculated"
  },
  "benefits": {
    "healthInsurance": true,
    "paidTimeOff": true,
    "otherBenefits": ["401k", "etc."]
  }
}

## Extraction Rules

1. Calculate averages from available pay periods
2. Note exact dates of missed work
3. Include all compensation types (base, overtime, bonuses)
4. Document any benefits that may be affected
5. Calculate total wage loss if data allows`;
