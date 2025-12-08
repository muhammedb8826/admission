import { fetchHomepageNotableAlumni } from "../services/notable-alumni.service";
import type { HomepageNotableAlumniSection } from "../types/notable-alumni.types";

export async function getHomepageNotableAlumni(): Promise<HomepageNotableAlumniSection | null> {
  return fetchHomepageNotableAlumni();
}

