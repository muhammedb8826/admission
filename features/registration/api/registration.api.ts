import {
  fetchGenderOptions,
  fetchNationalityOptions,
  fetchAlumniCategoryOptions,
} from "../services/registration.service";
import type { DropdownOption } from "../types/registration.types";

export async function getGenderOptions(): Promise<DropdownOption[]> {
  return fetchGenderOptions();
}

export async function getNationalityOptions(): Promise<DropdownOption[]> {
  return fetchNationalityOptions();
}

export async function getAlumniCategoryOptions(): Promise<DropdownOption[]> {
  return fetchAlumniCategoryOptions();
}

