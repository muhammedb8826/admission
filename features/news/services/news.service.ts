import { strapiFetch, getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";
import { StrapiCollectionResponse } from "@/lib/strapi/types";
import type { NewsListItem, NewsDetail } from "../types/news.types";

type StrapiImage = {
  url: string;
  formats?: Record<string, { url: string }>;
};

type StrapiNews = {
  id: number;
  title: string;
  slug: string | null;
  publishedDate: string;
  summary: string;
  featuredImage?: StrapiImage | null;
  isFeatured?: boolean;
  content?: string;
};

type StrapiNewsListResponse = StrapiCollectionResponse<StrapiNews>;

const NEWS_POPULATE = {
  featuredImage: {
    fields: ["url", "formats"],
  },
};

export async function fetchNewsList(): Promise<NewsListItem[]> {
  const response = await strapiFetch<StrapiNewsListResponse>("news", {
    params: {
      populate: NEWS_POPULATE,
      sort: ["publishedDate:desc"],
    },
    next: { revalidate: 60 },
  });

  if (!response.data) return [];

  const baseUrl = getStrapiURL();

  // Normalize slugs (strip leading slashes) and filter out entries without a usable slug
  return response.data
    .map((item) => {
      const rawSlug = item.slug ?? "";
      const normalizedSlug = rawSlug.replace(/^\/+/, ""); // e.g. \"/news-details\" → \"news-details\"

      return {
        id: String(item.id),
        title: item.title,
        slug: normalizedSlug,
        publishedDate: item.publishedDate,
        summary: item.summary,
        featuredImageUrl: resolveImageUrl(item.featuredImage ?? null, baseUrl),
        isFeatured: item.isFeatured ?? false,
      };
    })
    .filter((item) => item.slug && item.slug !== "null");
}

export async function fetchNewsBySlug(slug: string): Promise<NewsDetail | null> {
  const response = await strapiFetch<StrapiNewsListResponse>("news", {
    params: {
      populate: NEWS_POPULATE,
      filters: {
        slug: {
          $in: [slug, `/${slug}`], // handle stored slugs with or without leading slash
        },
      },
      pagination: { page: 1, pageSize: 1 },
    },
    next: { revalidate: 60 },
  });

  const news = response.data?.[0];
  if (!news) return null;

  const baseUrl = getStrapiURL();

  return {
    id: String(news.id),
    title: news.title,
    // Strapi type allows null, but this function is only called with a valid slug filter.
    // Fallback to the requested slug just in case.
    slug: news.slug ?? slug,
    publishedDate: news.publishedDate,
    summary: news.summary,
    content: news.summary, // placeholder if you later add a rich content field
    featuredImageUrl: resolveImageUrl(news.featuredImage ?? null, baseUrl),
    isFeatured: news.isFeatured ?? false,
    // Placeholder author - to be populated later
    author: {
      name: "Admin",
      avatar: undefined,
    },
  };
}

