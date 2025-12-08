import { fetchHomepageWhyJoinSection } from "../services/why-join.service";
import type { WhyJoinSection } from "../types/why-join.types";

export async function getHomepageWhyJoinSection(): Promise<WhyJoinSection | null> {
  return fetchHomepageWhyJoinSection();
}


