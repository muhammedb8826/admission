import { strapiFetch } from "@/lib/strapi/client";
import { StrapiCollectionResponse } from "@/lib/strapi/types";
import type { DropdownOption } from "../types/registration.types";

type StrapiEnumOption = {
  id: number;
  name: string;
  value?: string;
  displayOrder?: number;
};

// Fetch gender options from Strapi
export async function fetchGenderOptions(): Promise<DropdownOption[]> {
  try {
    // Assuming you have a 'gender' collection type or enum in Strapi
    // Adjust the endpoint based on your Strapi setup
    const response = await strapiFetch<StrapiCollectionResponse<StrapiEnumOption>>("genders", {
      params: {
        sort: ["displayOrder:asc", "name:asc"],
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.data) return [];

    return response.data.map((item) => ({
      id: String(item.id),
      label: item.name,
      value: item.value || item.name.toLowerCase(),
    }));
  } catch (error) {
    console.warn("Failed to fetch gender options:", error);
    // Return default options if Strapi fetch fails
    return [
      { id: "1", label: "Male", value: "male" },
      { id: "2", label: "Female", value: "female" },
      { id: "3", label: "Other", value: "other" },
    ];
  }
}

// Fetch nationality options from Strapi
export async function fetchNationalityOptions(): Promise<DropdownOption[]> {
  try {
    const response = await strapiFetch<StrapiCollectionResponse<StrapiEnumOption>>("nationalities", {
      params: {
        sort: ["displayOrder:asc", "name:asc"],
      },
      next: { revalidate: 3600 },
    });

    if (!response.data) return [];

    return response.data.map((item) => ({
      id: String(item.id),
      label: item.name,
      value: item.value || item.name.toLowerCase(),
    }));
  } catch (error) {
    console.warn("Failed to fetch nationality options:", error);
    return [];
  }
}

// Fetch alumni category options from Strapi
export async function fetchAlumniCategoryOptions(): Promise<DropdownOption[]> {
  try {
    const response = await strapiFetch<StrapiCollectionResponse<StrapiEnumOption>>("alumni-categories", {
      params: {
        sort: ["displayOrder:asc", "name:asc"],
      },
      next: { revalidate: 3600 },
    });

    if (!response.data) return [];

    return response.data.map((item) => ({
      id: String(item.id),
      label: item.name,
      value: item.value || item.name.toLowerCase(),
    }));
  } catch (error) {
    console.warn("Failed to fetch alumni category options:", error);
    return [];
  }
}

