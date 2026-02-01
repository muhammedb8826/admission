import { internalApiFetch } from "@/lib/strapi/client";
import type { ProgramOffering } from "../types/program-offerings.types";
import { headers } from "next/headers";

type ProgramOfferingsResponse = {
  data?: ProgramOffering[];
};

export async function getProgramOfferings(level?: string): Promise<ProgramOffering[]> {
  try {
    const headersList = await headers();
    const result = await internalApiFetch<ProgramOfferingsResponse>("/api/program-offerings", {
      params: {
        populate: "*",
        ...(level ? { level } : {}),
      },
      requestHeaders: headersList,
      cache: "no-store",
    });

    if (Array.isArray(result?.data)) {
      return result.data as ProgramOffering[];
    }
    return [];
  } catch (error) {
    console.error("Error fetching program offerings:", error);
    return [];
  }
}
