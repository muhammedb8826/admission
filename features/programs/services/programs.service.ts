import { strapiFetch } from "@/lib/strapi/client";
import { StrapiCollectionResponse } from "@/lib/strapi/types";
import { Program, ProgramType } from "../types/programs.types";

type StrapiImage = {
  id: number;
  url: string;
  formats?: Record<string, { url: string }>;
  alternativeText?: string | null;
};

type StrapiProgramGroup = {
  id: number;
  number: number;
  name: string;
};

type StrapiProgram = {
  id: number;
  documentId: string;
  title: string;
  description: string;
  type: ProgramType;
  duration: number;
  modeOfDelivery: string;
  program_group?: StrapiProgramGroup | null;
  image?: StrapiImage | null;
};

type StrapiProgramsResponse = StrapiCollectionResponse<StrapiProgram>;

export async function fetchPrograms(): Promise<Program[]> {
  const response = await strapiFetch<StrapiProgramsResponse>("programs", {
    params: { populate: "*" },
    next: { revalidate: 300 },
  });

  if (!response.data) {
    return [];
  }

  return response.data.map((program): Program => ({
    id: program.id,
    documentId: program.documentId,
    title: program.title,
    description: program.description,
    type: program.type,
    duration: program.duration,
    modeOfDelivery: program.modeOfDelivery,
    programGroup: program.program_group
      ? {
          id: program.program_group.id,
          number: program.program_group.number,
          name: program.program_group.name,
        }
      : null,
    image: program.image
      ? {
          url: program.image.url,
          formats: program.image.formats,
          alternativeText: program.image.alternativeText ?? undefined,
        }
      : undefined,
  }));
}

