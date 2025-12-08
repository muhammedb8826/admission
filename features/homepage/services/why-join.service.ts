import { strapiFetch } from "@/lib/strapi/client";
import { StrapiSingleResponse } from "@/lib/strapi/types";
import { WhyJoinCard, WhyJoinSection } from "../types/why-join.types";

const WHY_JOIN_COMPONENT = "homepage.why-you-should-join-us";

// Populate the dynamic zone block just like the URL you tested in Strapi:
// ?populate[blocks][on][homepage.why-you-should-join-us][populate]=*
const WHY_JOIN_POPULATE = {
  blocks: {
    on: {
      [WHY_JOIN_COMPONENT]: {
        populate: "*",
      },
    },
  },
};

type StrapiIcon = {
  width?: number;
  height?: number;
  iconData?: string;
  iconName?: string;
  isSvgEditable?: boolean;
  isIconNameEditable?: boolean;
};

type StrapiWhyJoinCard = {
  id: number;
  title: string;
  description: string;
  icon?: StrapiIcon | null;
};

type StrapiWhyJoinBlock = {
  __component: typeof WHY_JOIN_COMPONENT;
  id: number;
  heading?: string | null;
  subHeading?: string | null;
  cards?: StrapiWhyJoinCard[] | null;
};

type StrapiHomePageWhyJoinData = {
  id: number;
  documentId: string;
  blocks: Array<StrapiWhyJoinBlock | Record<string, unknown>>;
};

type StrapiHomePageWhyJoinResponse = StrapiSingleResponse<StrapiHomePageWhyJoinData>;

export async function fetchHomepageWhyJoinSection(): Promise<WhyJoinSection | null> {
  const response = await strapiFetch<StrapiHomePageWhyJoinResponse>("home-page", {
    params: { populate: WHY_JOIN_POPULATE },
    next: { revalidate: 60 },
  });

  if (!response.data?.blocks) {
    return null;
  }

  const whyJoinBlock = response.data.blocks.find(
    (block): block is StrapiWhyJoinBlock =>
      typeof (block as StrapiWhyJoinBlock).__component === "string" &&
      (block as StrapiWhyJoinBlock).__component === WHY_JOIN_COMPONENT
  );

  if (!whyJoinBlock) {
    return null;
  }

  const cards: WhyJoinCard[] =
    whyJoinBlock.cards?.map((card) => ({
      id: String(card.id),
      title: card.title,
      description: card.description,
      iconName: card.icon?.iconName,
      iconData: card.icon?.iconData,
    })) ?? [];

  return {
    heading: whyJoinBlock.heading ?? "",
    subHeading: whyJoinBlock.subHeading ?? undefined,
    cards,
  };
}


