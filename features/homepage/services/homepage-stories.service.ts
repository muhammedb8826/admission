import { strapiFetch, getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";
import { StrapiSingleResponse, StrapiCollectionResponse } from "@/lib/strapi/types";
import type {
  HomepageStoriesData,
  SuccessStoriesSection,
  AlumniSuccessStoriesSection,
  HomepageStoriesCard,
} from "../types/homepage-stories.types";

// Strapi component key
const STORIES_COMPONENT = "homepage.stories";

type StrapiImage = {
  url: string;
  formats?: Record<string, { url: string }>;
};

type StrapiSuccessStories = {
  id: number;
  title: string;
  stories?: Array<{
    id: number;
    title: string;
    slug: string;
    publishedDate: string;
    summary: string;
  }>;
};

type StrapiAlumniSuccessStories = {
  id: number;
  title: string;
  subTitle?: string | null;
  cards?: Array<{
    id: number;
    number?: number;
    description?: string;
    title?: string;
    [key: string]: unknown;
  }>;
};

type StrapiHomepageStoriesBlock = {
  __component: typeof STORIES_COMPONENT;
  id: number;
  heading?: string | null;
  successStories?: StrapiSuccessStories | null;
  alumniSuccessStories?: StrapiAlumniSuccessStories | null;
};

type StrapiHomePageData = {
  id: number;
  documentId: string;
  blocks: (StrapiHomepageStoriesBlock | Record<string, unknown>)[];
};

type StrapiHomePageResponse = StrapiSingleResponse<StrapiHomePageData>;

export async function fetchHomepageStories(): Promise<HomepageStoriesData> {
  try {
    // Fetch the homepage.stories block with both sections.
    // This populate matches the working query you tested in Postman:
    // ?populate[blocks][on][homepage.stories][populate][successStories][populate][stories][fields][0]=id
    // &populate[blocks][on][homepage.stories][populate][successStories][populate][stories][fields][1]=title
    // &populate[blocks][on][homepage.stories][populate][successStories][populate][stories][fields][2]=slug
    // &populate[blocks][on][homepage.stories][populate][successStories][populate][stories][fields][3]=publishedDate
    // &populate[blocks][on][homepage.stories][populate][successStories][populate][stories][fields][4]=summary
    // &populate[blocks][on][homepage.stories][populate][alumniSuccessStories][populate][cards]=*
    const response = await strapiFetch<StrapiHomePageResponse>("home-page", {
      params: {
        populate: {
          blocks: {
            on: {
              [STORIES_COMPONENT]: {
                populate: {
                  successStories: {
                    populate: {
                      stories: {
                        fields: ["id", "title", "slug", "publishedDate", "summary"],
                      },
                    },
                  },
                  alumniSuccessStories: {
                    populate: {
                      cards: "*",
                    },
                  },
                },
              },
            },
          },
        },
      },
      next: { revalidate: 60 },
    });

    // Debug: log the full response to see what we're getting
    console.log("Home-page API response:", JSON.stringify(response, null, 2));

    // Handle empty response
    if (!response.data) {
      console.warn("No data in home-page response - this likely means the API call failed silently");
      return {};
    }

    if (!response.data?.blocks) {
      console.warn("No blocks found in home-page response. Data:", response.data);
      return {};
    }

    // Find the homepage.stories block
    const storiesBlock = response.data.blocks.find(
      (block): block is StrapiHomepageStoriesBlock =>
        typeof (block as StrapiHomepageStoriesBlock).__component === "string" &&
        (block as StrapiHomepageStoriesBlock).__component === STORIES_COMPONENT
    );

    if (!storiesBlock) {
      console.warn("homepage.stories block not found in response");
      return {};
    }

    const result: HomepageStoriesData = {
      heading: (storiesBlock.heading as string) || "Stories",
    };

  // Process successStories section
  if (storiesBlock.successStories) {
    const successStories: SuccessStoriesSection = {
      // Use the inner successStories title; block title is for the wrapper heading
      title: storiesBlock.successStories.title || "Success Stories",
      stories: [],
    };

    // Extract story slugs from the relation
    if (storiesBlock.successStories.stories && storiesBlock.successStories.stories.length > 0) {
      const storySlugs = storiesBlock.successStories.stories
        .filter((story) => story.slug)
        .map((story) => story.slug as string);

      if (storySlugs.length > 0) {
        // Fetch full story details with proper population using the stories endpoint
        const storiesResponse = await strapiFetch<
          StrapiCollectionResponse<{
            id: number;
            title: string;
            slug: string;
            publishedDate: string;
            summary: string;
            featuredImage?: StrapiImage | null;
          }>
        >("stories", {
          params: {
            filters: {
              slug: {
                $in: storySlugs,
              },
            },
            populate: {
              featuredImage: {
                fields: ["url", "formats"],
              },
            },
          },
          next: { revalidate: 60 },
        });

        if (storiesResponse.data && storiesResponse.data.length > 0) {
          const baseUrl = getStrapiURL();
          successStories.stories = storiesResponse.data.map((story) => ({
            id: String(story.id),
            title: story.title,
            slug: story.slug,
            publishedDate: story.publishedDate,
            summary: story.summary,
            featuredImageUrl: resolveImageUrl(story.featuredImage ?? null, baseUrl),
          }));
        }
      }
    }

    result.successStories = successStories;
  }

  // Process alumniSuccessStories section
  if (storiesBlock.alumniSuccessStories) {
    const alumniSuccessStories: AlumniSuccessStoriesSection = {
      title: storiesBlock.alumniSuccessStories.title,
      subTitle: storiesBlock.alumniSuccessStories.subTitle ?? undefined,
      cards: [],
    };

    // Process cards from the DynamicZone
    if (storiesBlock.alumniSuccessStories.cards) {
      alumniSuccessStories.cards = storiesBlock.alumniSuccessStories.cards.map((card) => ({
        id: String(card.id),
        number: card.number,
        description: card.description,
        title: card.title,
        // Map other card properties
        ...Object.fromEntries(
          Object.entries(card).filter(
            ([key]) => !["id", "__component", "number", "description", "title"].includes(key)
          )
        ),
      })) as HomepageStoriesCard[];
    }

    result.alumniSuccessStories = alumniSuccessStories;
  }


    return result;
  } catch (error) {
    // Log error but return empty object to allow page to render
    console.warn("Failed to fetch homepage stories:", error);
    return {};
  }
}

