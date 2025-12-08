import { strapiFetch, getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";
import { StrapiSingleResponse } from "@/lib/strapi/types";
import type { HomepageGallerySection, GalleryImage } from "../types/gallery.types";

const GALLERY_COMPONENT = "homepage.gallery";

type StrapiImage = {
  url: string;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: Record<string, { url: string }>;
};

type StrapiGalleryBlock = {
  __component: typeof GALLERY_COMPONENT;
  id: number;
  heading?: string | null;
  title?: string | null;
  subTitle?: string | null;
  galleryImages?: StrapiImage[] | null;
};

type StrapiHomePageGalleryData = {
  id: number;
  documentId: string;
  blocks: Array<StrapiGalleryBlock | Record<string, unknown>>;
};

type StrapiHomePageGalleryResponse = StrapiSingleResponse<StrapiHomePageGalleryData>;

// Populate the dynamic zone block for the gallery section
const GALLERY_POPULATE = {
  blocks: {
    on: {
      [GALLERY_COMPONENT]: {
        populate: {
          galleryImages: {
            populate: "*",
          },
        },
      },
    },
  },
};

export async function fetchHomepageGallerySection(): Promise<HomepageGallerySection | null> {
  try {
    const response = await strapiFetch<StrapiHomePageGalleryResponse>("home-page", {
      params: { populate: GALLERY_POPULATE },
      next: { revalidate: 60 },
    });

    if (!response.data?.blocks) {
      return null;
    }

    const galleryBlock = response.data.blocks.find(
      (block): block is StrapiGalleryBlock =>
        typeof (block as StrapiGalleryBlock).__component === "string" &&
        (block as StrapiGalleryBlock).__component === GALLERY_COMPONENT
    );

    if (!galleryBlock) {
      return null;
    }

    const baseUrl = getStrapiURL();

    const images: GalleryImage[] =
      galleryBlock.galleryImages?.map((image) => ({
        id: image.url, // use URL as a stable id if numeric id is not present
        src: resolveImageUrl(
          {
            url: image.url,
            formats: image.formats,
          },
          baseUrl
        )!,
        alt: image.alternativeText || galleryBlock.title || galleryBlock.heading || "Gallery image",
        width: image.width ?? undefined,
        height: image.height ?? undefined,
      })) ?? [];

    if (!images.length) {
      return null;
    }

    return {
      heading: galleryBlock.heading || "Gallery",
      title: galleryBlock.title || "Image Gallery",
      subTitle: galleryBlock.subTitle || undefined,
      images,
    };
  } catch (error) {
    console.warn("Failed to fetch homepage gallery section:", error);
    return null;
  }
}


