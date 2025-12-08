import { strapiFetch, getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";
import { StrapiSingleResponse } from "@/lib/strapi/types";
import { HomepageCarouselItem } from "../types/carousel.types";

// Strapi component key for the homepage slider block inside the `blocks` dynamic zone
const HERO_COMPONENT = "homepage.slider";
const HERO_POPULATE = {
  blocks: {
    on: {
      [HERO_COMPONENT]: {
        populate: {
          // `slides` is the repeatable component field inside `homepage.slider`
          slides: {
            fields: ["heading", "subHeading"],
            populate: {
              image: {
                // We only need URL here; add more fields if required
                fields: ["url"],
              },
              link: {
                fields: ["title", "url", "isExternal"],
              },
            },
          },
        },
      },
    },
  },
};

type StrapiImage = {
  url: string;
  formats?: Record<string, { url: string }>;
};

type StrapiSlide = {
  id: number;
  heading: string;
  subHeading?: string | null;
  image: StrapiImage | null;
  link?: {
    id: number;
    title: string;
    url: string;
    isExternal: boolean;
  } | null;
};

type StrapiHeroBlock = {
  __component: typeof HERO_COMPONENT;
  id: number;
  // Matches `slides` field returned by Strapi for `homepage.slider`
  slides: StrapiSlide[];
};

type StrapiHomePageData = {
  id: number;
  documentId: string;
  blocks: StrapiHeroBlock[];
};

type StrapiHomePageResponse = StrapiSingleResponse<StrapiHomePageData>;

export async function fetchHomepageCarouselItems(): Promise<HomepageCarouselItem[]> {
  const response = await strapiFetch<StrapiHomePageResponse>("home-page", {
    params: { populate: HERO_POPULATE },
    next: { revalidate: 60 },
  });

  // Handle empty response (when Strapi URL is not configured)
  if (!response.data?.blocks) {
    return [];
  }

  const heroBlock = response.data.blocks.find(
    (block): block is StrapiHeroBlock => block.__component === HERO_COMPONENT
  );

  if (!heroBlock) {
    return [];
  }

  const baseUrl = getStrapiURL();

  return heroBlock.slides.map((slide) => ({
    id: String(slide.id),
    title: slide.heading,
    description: slide.subHeading ?? undefined,
    imageUrl: resolveImageUrl(slide.image, baseUrl),
    link: slide.link
      ? {
          title: slide.link.title,
          url: slide.link.url,
          isExternal: slide.link.isExternal,
        }
      : undefined,
  }));
}

