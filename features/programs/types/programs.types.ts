export type ProgramType = "undergraduate" | "postgraduate" | "phd" | "remedial" | "pgdt";

export type Department = {
  id: number;
  documentId: string;
  name: string;
  code: string | null;
  description: string | null;
};

export type Program = {
  id: number;
  name: string;
  fullName: string;
  description: string;
  duration: number;
  level: string; // Values: "Undergraduate" | "Postgraduate" | "PhD" | "PGDT" | "Remedial"
  mode: string;
  totalCreditHours: number;
  qualification: string;
  department?: Department
  batches?: Array<{
    name: string;
    startYear: number;
    endYear: number;
    academic_calendar?: {
      academicYearRange: string;
    } | null;
  }>;
  image?: {
    url: string;
    formats?: Record<string, { url: string }>;
    alternativeText?: string | null;
  } | null;
};

export type ProgramsFilter = "all" | "undergraduate" | "postgraduate" | "phd" | "remedial" | "pgdt";

