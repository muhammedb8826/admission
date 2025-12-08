import { strapiFetch, getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";
import type { StrapiCollectionResponse, StrapiSingleResponse } from "@/lib/strapi/types";
import type { AlumniListItem, AlumniDetail } from "../types/alumni.types";

type StrapiImage = {
  url: string;
  alternativeText?: string | null;
  formats?: Record<string, { url: string }>;
};

type StrapiAlumni = {
  id: number;
  documentId?: string | null;
  slug?: string | null;
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  phoneNumber?: string | null;
  email?: string | null;
  birthDate?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  address?: string | null;
  profileImage?: StrapiImage | null;
};

type StrapiAlumniListResponse = StrapiCollectionResponse<StrapiAlumni>;
type StrapiAlumniDetailResponse = StrapiSingleResponse<StrapiAlumni>;

const ALUMNI_POPULATE = {
  populate: {
    profileImage: {
      populate: "*",
    },
  },
};

export async function fetchAlumniList(): Promise<AlumniListItem[]> {
  const response = await strapiFetch<StrapiAlumniListResponse>("almuni-registrations", {
    params: {
      ...ALUMNI_POPULATE,
      sort: ["createdAt:desc"],
      pagination: {
        page: 1,
        pageSize: 100,
      },
    },
  });

  if (!response.data) return [];

  const baseUrl = getStrapiURL();

  return response.data.map((item) => {
    let profileImageUrl: string | null = null;
    if (item.profileImage) {
      profileImageUrl =
        resolveImageUrl(
          {
            url: item.profileImage.url,
            formats: item.profileImage.formats,
          },
          baseUrl
        ) || item.profileImage.url;
    }

    // Generate slug from full name if not provided
    const generateSlug = (firstName: string, fatherName: string, grandFatherName: string): string => {
      const fullName = `${firstName} ${fatherName} ${grandFatherName}`.trim();
      return fullName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    };

    return {
      id: String(item.id),
      documentId: item.documentId || String(item.id), // Use documentId if available, fallback to id
      slug: item.slug || generateSlug(item.firstName, item.fatherName, item.grandFatherName) || String(item.id),
      fullName: `${item.firstName} ${item.fatherName} ${item.grandFatherName}`.trim(),
      jobTitle: item.jobTitle ?? undefined,
      companyName: item.companyName ?? undefined,
      location: item.address ?? undefined,
      profileImageUrl,
    };
  });
}

export async function fetchAlumniBySlug(slug: string): Promise<AlumniDetail | null> {
  const response = await strapiFetch<StrapiAlumniListResponse>("almuni-registrations", {
    params: {
      ...ALUMNI_POPULATE,
      filters: {
        slug: {
          $eq: slug,
        },
      },
      pagination: {
        page: 1,
        pageSize: 1,
      },
    },
    next: { revalidate: 60 },
  });

  const item = response.data?.[0];
  if (!item) {
    console.warn(`Alumni not found with slug: ${slug}`);
    return null;
  }

  const baseUrl = getStrapiURL();

  let profileImageUrl: string | null = null;
  if (item.profileImage) {
    profileImageUrl =
      resolveImageUrl(
        {
          url: item.profileImage.url,
          formats: item.profileImage.formats,
        },
        baseUrl
      ) || item.profileImage.url;
  }

  return {
    id: String(item.id),
    firstName: item.firstName,
    fatherName: item.fatherName,
    grandFatherName: item.grandFatherName,
    fullName: `${item.firstName} ${item.fatherName} ${item.grandFatherName}`.trim(),
    phoneNumber: item.phoneNumber ?? undefined,
    email: item.email ?? undefined,
    birthDate: item.birthDate ?? undefined,
    jobTitle: item.jobTitle ?? undefined,
    companyName: item.companyName ?? undefined,
    location: item.address ?? undefined,
    profileImageUrl,
  };
}

// Keep fetchAlumniById for backward compatibility, but it's deprecated
export async function fetchAlumniById(id: string): Promise<AlumniDetail | null> {
  // Determine if id is numeric or documentId
  const isNumericId = !isNaN(Number(id)) && !isNaN(parseFloat(id));
  
  let response: StrapiAlumniDetailResponse | null = null;
  let item: StrapiAlumni | null = null;

  // Try direct fetch by numeric id first
  if (isNumericId) {
    const directResponse = await strapiFetch<StrapiAlumniDetailResponse>(
      `almuni-registrations/${id}`,
      {
        params: ALUMNI_POPULATE,
        next: { revalidate: 60 },
      }
    );
    
    if (directResponse.data) {
      item = directResponse.data;
    }
  }

  // If direct fetch failed or it's a documentId, try filter by documentId
  if (!item) {
    const filterResponse = await strapiFetch<StrapiAlumniListResponse>(
      "almuni-registrations",
      {
        params: {
          ...ALUMNI_POPULATE,
          filters: {
            documentId: id,
          },
          pagination: {
            page: 1,
            pageSize: 1,
          },
        },
        next: { revalidate: 60 },
      }
    );
    
    if (filterResponse.data && filterResponse.data.length > 0) {
      item = filterResponse.data[0];
    }
  }

  // If still not found and it's numeric, try filter by id as fallback
  if (!item && isNumericId) {
    const idFilterResponse = await strapiFetch<StrapiAlumniListResponse>(
      "almuni-registrations",
      {
        params: {
          ...ALUMNI_POPULATE,
          filters: {
            id: {
              $eq: Number(id),
            },
          },
          pagination: {
            page: 1,
            pageSize: 1,
          },
        },
        next: { revalidate: 60 },
      }
    );
    
    if (idFilterResponse.data && idFilterResponse.data.length > 0) {
      item = idFilterResponse.data[0];
    }
  }

  if (!item) {
    console.warn(`Alumni not found with id: ${id} (numeric: ${isNumericId})`);
    return null;
  }

  const baseUrl = getStrapiURL();

  let profileImageUrl: string | null = null;
  if (item.profileImage) {
    profileImageUrl =
      resolveImageUrl(
        {
          url: item.profileImage.url,
          formats: item.profileImage.formats,
        },
        baseUrl
      ) || item.profileImage.url;
  }

  return {
    id: String(item.id),
    firstName: item.firstName,
    fatherName: item.fatherName,
    grandFatherName: item.grandFatherName,
    fullName: `${item.firstName} ${item.fatherName} ${item.grandFatherName}`.trim(),
    phoneNumber: item.phoneNumber ?? undefined,
    email: item.email ?? undefined,
    birthDate: item.birthDate ?? undefined,
    jobTitle: item.jobTitle ?? undefined,
    companyName: item.companyName ?? undefined,
    location: item.address ?? undefined,
    profileImageUrl,
  };
}


