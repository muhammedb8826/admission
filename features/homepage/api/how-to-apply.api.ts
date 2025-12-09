import { fetchHowToApplySection } from "../services/how-to-apply.service";
import type { HowToApplySection } from "../types/how-to-apply.types";

export async function getHowToApplySection(): Promise<HowToApplySection | null> {
  return fetchHowToApplySection();
}

