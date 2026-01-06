export type ProgramSummary = {
  id: string;
  name: string;
  fullName: string;
  duration: number;
  level: string;
  mode: string;
};

export type BatchSummary = {
  id: string;
  name: string;
  code: string;
  intakeYear: number;
  startYear: number;
  endYear: number;

  program?: ProgramSummary | null;
};

export type SemesterItem = {
  id: string;
  name: string;
  semesterNumber: number;
  yearNumber: number;
  startDate: string;
  endDate: string;
  examStart: string;
  examEnd: string;
};

export type CalendarListItem = {
  id: string;
  documentId: string;
  slug: string;

  name: string;
  academicYearRange: string;
  isActive: boolean;

  startDate: string;
  endDate: string;

  createdAt: string;
  updatedAt: string;
  publishedAt: string;

  program: ProgramSummary | null;
  batch: BatchSummary | null;
  semesters: SemesterItem[];
};


export type CalendarTableRow = {
  id: string
  slug: string
  name: string
  program: string
  batch: string
  academicYear: string
  status: "Active" | "Inactive"
  semestersCount: number
}