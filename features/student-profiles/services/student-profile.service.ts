import { internalApiFetch } from "@/lib/strapi/client";
import { StrapiSingleResponse } from "@/lib/strapi/types";
import type { StudentProfile } from "../types/student-profile.types";
import { headers } from "next/headers";

/**
 * Fetch the current user's student profile
 * Uses the internal API route which handles authentication and filtering
 */
export async function getStudentProfile(): Promise<StudentProfile | null> {
  try {
    const headersList = await headers();
    
    const result = await internalApiFetch<StrapiSingleResponse<StudentProfile>>(
      "/api/student-profiles",
      {
        params: {
          populate: {
            residentialAddress: { populate: "*" },
            birthAddress: { populate: "*" },
            personToBeContacted: { populate: "*" },
            primary_education: { populate: "*" },
            secondary_education: { populate: "*" },
            tertiary_educations: { populate: "*" },
            professional_experiences: { populate: "*" },
            research_engagements: { populate: "*" },
          },
        },
        requestHeaders: headersList,
        cache: "no-store",
      }
    );
    
    if (result?.data) {
      return result.data;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return null;
  }
}
