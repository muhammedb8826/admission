import { getPrograms as fetchFromService } from "../services/programs.service";
import { Program } from "../types/programs.types";

/**
 * Fetches all programs from the service layer.
 * This is the function called by your Next.js Server Components (Pages).
 */
export async function getPrograms(): Promise<Program[]> {
  try {
    return await fetchFromService();
  } catch (error) {
    console.error("Failed to fetch programs:", error);
    return []; // Return empty array to prevent page crash
  }
}