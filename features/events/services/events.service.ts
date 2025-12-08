import { strapiFetch, getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";
import { StrapiCollectionResponse } from "@/lib/strapi/types";
import type { EventListItem, EventDetail } from "../types/events.types";

type StrapiImage = {
  url: string;
  formats?: Record<string, { url: string }>;
};

type StrapiEvent = {
  id: number;
  title: string;
  slug: string;
  shortDescription?: string | null;
  summary: string;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  featuredImage?: StrapiImage | null;
  isFeatured?: boolean;
  content?: string;
};

type StrapiEventsListResponse = StrapiCollectionResponse<StrapiEvent>;

const EVENTS_POPULATE = {
  featuredImage: {
    fields: ["url", "formats"],
  },
};

export async function fetchEventsList(): Promise<EventListItem[]> {
  const response = await strapiFetch<StrapiEventsListResponse>("events", {
    params: {
      populate: EVENTS_POPULATE,
      sort: ["startDate:desc"],
    },
    next: { revalidate: 60 },
  });

  if (!response.data) return [];

  const baseUrl = getStrapiURL();

  return response.data.map((item) => ({
    id: String(item.id),
    title: item.title,
    slug: item.slug,
    shortDescription: item.shortDescription ?? undefined,
    summary: item.summary,
    startDate: item.startDate,
    endDate: item.endDate ?? undefined,
    location: item.location ?? undefined,
    featuredImageUrl: resolveImageUrl(item.featuredImage ?? null, baseUrl),
    isFeatured: item.isFeatured ?? false,
  }));
}

export async function fetchEventBySlug(slug: string): Promise<EventDetail | null> {
  const response = await strapiFetch<StrapiEventsListResponse>("events", {
    params: {
      populate: EVENTS_POPULATE,
      filters: {
        slug: {
          $eq: slug,
        },
      },
      pagination: { page: 1, pageSize: 1 },
    },
    next: { revalidate: 60 },
  });

  const event = response.data?.[0];
  if (!event) return null;

  const baseUrl = getStrapiURL();

  return {
    id: String(event.id),
    title: event.title,
    slug: event.slug,
    shortDescription: event.shortDescription ?? undefined,
    summary: event.summary,
    startDate: event.startDate,
    endDate: event.endDate ?? undefined,
    location: event.location ?? undefined,
    featuredImageUrl: resolveImageUrl(event.featuredImage ?? null, baseUrl),
    isFeatured: event.isFeatured ?? false,
    content: event.summary, // placeholder if you later add a rich content field
  };
}

