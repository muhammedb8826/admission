import { fetchPrograms } from "../services/programs.service";
import type { Program } from "../types/programs.types";

export async function getPrograms(): Promise<Program[]> {
  return fetchPrograms();
}

