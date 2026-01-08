import { strapiFetch } from "@/lib/strapi/client";
import { StrapiCollectionResponse } from "@/lib/strapi/types";
import { Program, ProgramType } from "../types/programs.types";

// Types used only within this service to describe raw Strapi data
type StrapiImage = {
  id: number;
  url: string;
  formats?: Record<string, { url: string }>;
  alternativeText?: string | null;
};

type StrapiDepartment = {
  id: number;
  documentId: string;
  name: string;
  code: string | null;
  description: string | null;
};

type StrapiProgram = {
  id: number;
  documentId: string;
  name: string; // Changed from title to name
  fullName: string;
  description: string;
  level: string; // "Undergraduate", "Postgraduate", etc.
  duration: number;
  mode: string; // Changed from modeOfDelivery to mode
  totalCreditHours: number;
  qualification: string;
  department?: StrapiDepartment | null;
  image?: StrapiImage | null;
};

type StrapiProgramsResponse = StrapiCollectionResponse<StrapiProgram>;

export async function getPrograms(): Promise<Program[]> {
  const response = await strapiFetch<StrapiProgramsResponse>("programs", {
    params: { 
      populate: {
        department: true,
        image: true,
        batches: true // Ensure batches are populated if you want to show them
      } 
    },
    next: { revalidate: 300 },
  });

  if (!response.data) {
    return [];
  }

  // Mapping the Strapi response to our clean Frontend Type (Program)
  return response.data.map((program): Program => ({
    id: program.id,
    name: program.name,
    fullName: program.fullName,
    description: program.description,
    duration: program.duration,
    level: program.level,
    mode: program.mode,
    totalCreditHours: program.totalCreditHours,
    qualification: program.qualification,
    department: program.department 
      ? {
          id: program.department.id,
          documentId: program.department.documentId,
          name: program.department.name,
          code: program.department.code,
          description: program.department.description,
        }
      : undefined,
    image: program.image
      ? {
          url: program.image.url,
          formats: program.image.formats,
          alternativeText: program.image.alternativeText,
        }
      : null,
  }));
}