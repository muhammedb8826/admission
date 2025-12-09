export type ProgramType = "undergraduate" | "graduate";

export type ProgramGroup = {
  id: number;
  number: number;
  name: string;
};

export type Program = {
  id: number;
  documentId: string;
  title: string;
  description: string;
  type: ProgramType;
  duration: number;
  modeOfDelivery: string;
  programGroup?: ProgramGroup | null;
  image?: {
    url: string;
    formats?: Record<string, { url: string }>;
    alternativeText?: string | null;
  } | null;
};

export type ProgramsFilter = "all" | ProgramType;

