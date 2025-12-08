import { strapiFetch, getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";
import { StrapiCollectionResponse, StrapiSingleResponse } from "@/lib/strapi/types";
import type { StoryListItem, StoryDetail } from "../types/stories.types";

type StrapiImage = {
  url: string;
  formats?: Record<string, { url: string }>;
};

type StrapiStory = {
  id: number;
  title: string;
  slug: string;
  publishedDate: string;
  summary: string;
  featuredImage?: StrapiImage | null;
  content?: string;
};

type StrapiStoriesListResponse = StrapiCollectionResponse<StrapiStory>;
type StrapiStoryDetailResponse = StrapiSingleResponse<StrapiStory>;

const STORIES_POPULATE = {
  featuredImage: {
    fields: ["url", "formats"],
  },
};

export async function fetchStoriesList(): Promise<StoryListItem[]> {
  const response = await strapiFetch<StrapiStoriesListResponse>("stories", {
    params: {
      populate: STORIES_POPULATE,
      sort: ["publishedDate:desc"],
    },
    next: { revalidate: 60 },
  });

  if (!response.data) return [];

  const baseUrl = getStrapiURL();

  return response.data.map((item) => ({
    id: String(item.id),
    title: item.title,
    slug: item.slug,
    publishedDate: item.publishedDate,
    summary: item.summary,
    featuredImageUrl: resolveImageUrl(item.featuredImage ?? null, baseUrl),
  }));
}

export async function fetchStoryBySlug(slug: string): Promise<StoryDetail | null> {
  const response = await strapiFetch<StrapiStoriesListResponse>("stories", {
    params: {
      populate: STORIES_POPULATE,
      filters: {
        slug: {
          $eq: slug,
        },
      },
      pagination: { page: 1, pageSize: 1 },
    },
    next: { revalidate: 60 },
  });

  const story = response.data?.[0];
  if (!story) return null;

  const baseUrl = getStrapiURL();

  return {
    id: String(story.id),
    title: story.title,
    slug: story.slug,
    publishedDate: story.publishedDate,
    summary: story.summary,
    content: story.summary, // placeholder if you later add a rich content field
    featuredImageUrl: resolveImageUrl(story.featuredImage ?? null, baseUrl),
  };
}


