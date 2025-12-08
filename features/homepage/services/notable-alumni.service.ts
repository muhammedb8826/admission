import { strapiFetch, getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";
import { StrapiSingleResponse } from "@/lib/strapi/types";
import type {
  HomepageNotableAlumniSection,
  NotableAlumniItem,
} from "../types/notable-alumni.types";

// Strapi component key
const NOTABLE_ALUMNI_COMPONENT = "homepage.notable-alumni";

type StrapiImage = {
  url: string;
  alternativeText?: string | null;
  formats?: Record<string, { url: string }>;
};

type StrapiAlumniRegistration = {
  id: number;
  documentId?: string | null;
  slug?: string | null;
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  jobTitle?: string | null;
  companyName?: string | null;
  address?: string | null;
  profileImage?: StrapiImage | null;
};

type StrapiNotableAlumniBlock = {
  __component: typeof NOTABLE_ALUMNI_COMPONENT;
  id: number;
  heading?: string | null;
  subHeading?: string | null;
  almuni_registrations?: StrapiAlumniRegistration[] | null;
};

type StrapiHomePageNotableAlumniData = {
  id: number;
  documentId: string;
  blocks: Array<StrapiNotableAlumniBlock | Record<string, unknown>>;
};

type StrapiHomePageNotableAlumniResponse =
  StrapiSingleResponse<StrapiHomePageNotableAlumniData>;

const NOTABLE_ALUMNI_POPULATE = {
  blocks: {
    on: {
      "homepage.notable-alumni": {
        populate: {
          almuni_registrations: {
            populate: {
              profileImage: {
                populate: "*",
              },
            },
          },
        },
      },
    },
  },
};

export async function fetchHomepageNotableAlumni(): Promise<HomepageNotableAlumniSection | null> {
  const response = await strapiFetch<StrapiHomePageNotableAlumniResponse>("home-page", {
    params: { populate: NOTABLE_ALUMNI_POPULATE },
    next: { revalidate: 60 },
  });

  const blocks = response.data?.blocks;
  if (!blocks) return null;

  const block = blocks.find(
    (b): b is StrapiNotableAlumniBlock =>
      (b as any).__component === NOTABLE_ALUMNI_COMPONENT
  );
  if (!block) return null;

  const baseUrl = getStrapiURL();

  const alumni: NotableAlumniItem[] =
    block.almuni_registrations?.map((item) => {
      const fullName = `${item.firstName} ${item.fatherName} ${item.grandFatherName}`.trim();

      // Generate slug from full name if not provided
      const generateSlug = (firstName: string, fatherName: string, grandFatherName: string): string => {
        const name = `${firstName} ${fatherName} ${grandFatherName}`.trim();
        return name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      };

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
        documentId: item.documentId || String(item.id), // Use documentId if available, fallback to id
        slug: item.slug || generateSlug(item.firstName, item.fatherName, item.grandFatherName) || String(item.id),
        fullName,
        jobTitle: item.jobTitle ?? undefined,
        companyName: item.companyName ?? undefined,
        location: item.address ?? undefined,
        profileImageUrl,
      };
    }) ?? [];

  if (!alumni.length) return null;

  return {
    heading: block.heading || "Notable Alumni",
    subHeading: block.subHeading || undefined,
    alumni,
  };
}

