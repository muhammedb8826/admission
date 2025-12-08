import { strapiFetch, getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";
import { StrapiSingleResponse } from "@/lib/strapi/types";
import type { HomepageNewsBlogsSection, NewsBlogItem } from "../types/news-blogs.types";

type StrapiImage = {
  url: string;
  formats?: Record<string, { url: string }>;
};

type StrapiNewsItem = {
  id: number;
  documentId?: string;
  title: string;
  slug: string | null;
  publishedDate: string;
  summary: string;
  featuredImage?: StrapiImage | null;
  isFeatured?: boolean;
};

type StrapiHomepageNewsBlogsBlock = {
  __component: "homepage.news-and-blogs";
  id: number;
  heading: string;
  title: string;
  subTitle?: string | null;
  news?: StrapiNewsItem[];
};

type StrapiHomePage = {
  id: number;
  blocks?: Array<StrapiHomepageNewsBlogsBlock | Record<string, unknown>>;
};

type StrapiHomePageResponse = StrapiSingleResponse<StrapiHomePage>;

const NEWS_BLOGS_COMPONENT = "homepage.news-and-blogs";

const NEWS_BLOGS_POPULATE = {
  blocks: {
    on: {
      [NEWS_BLOGS_COMPONENT]: {
        populate: {
          news: {
            fields: ["id", "documentId", "title", "slug", "publishedDate", "summary", "isFeatured"],
            populate: {
              featuredImage: {
                populate: "*",
              },
            },
          },
        },
      },
    },
  },
};

export async function fetchHomepageNewsBlogs(): Promise<HomepageNewsBlogsSection | null> {
  try {
    const response = await strapiFetch<StrapiHomePageResponse>("home-page", {
      params: {
        populate: NEWS_BLOGS_POPULATE,
      },
      next: { revalidate: 60 },
    });

    if (!response?.data?.blocks) {
      console.warn("No blocks found in home-page response for news-blogs");
      return null;
    }

    // Find the news-and-blogs block
    const newsBlogsBlock = response.data.blocks.find(
      (block): block is StrapiHomepageNewsBlogsBlock =>
        (block as StrapiHomepageNewsBlogsBlock).__component === NEWS_BLOGS_COMPONENT
    );

    if (!newsBlogsBlock || !newsBlogsBlock.news || newsBlogsBlock.news.length === 0) {
      console.warn("No news-and-blogs block or news items found");
      return null;
    }

    const baseUrl = getStrapiURL();

    // Transform news items
    const newsItems: NewsBlogItem[] = newsBlogsBlock.news.map((item) => {
      const featuredImageUrl = item.featuredImage
        ? resolveImageUrl(
            {
              url: item.featuredImage.url,
              formats: item.featuredImage.formats,
            },
            baseUrl
          )
        : undefined;

      return {
        id: String(item.id),
        documentId: item.documentId || String(item.id),
        title: item.title,
        slug: item.slug || "",
        publishedDate: item.publishedDate,
        summary: item.summary,
        featuredImageUrl,
        isFeatured: item.isFeatured || false,
      };
    });

    return {
      heading: newsBlogsBlock.heading,
      title: newsBlogsBlock.title,
      subTitle: newsBlogsBlock.subTitle || undefined,
      news: newsItems,
    };
  } catch (error) {
    console.error("Failed to fetch homepage news and blogs:", error);
    return null;
  }
}

