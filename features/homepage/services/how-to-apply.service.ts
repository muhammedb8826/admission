import { strapiFetch } from "@/lib/strapi/client";
import { StrapiSingleResponse } from "@/lib/strapi/types";
import { HowToApplySection, HowToApplyStep, HowToApplyLink } from "../types/how-to-apply.types";

type StrapiHowToApplyStep = {
  id: number;
  title: string;
  description?: string | null;
};

type StrapiHowToApplyStepsBlock = {
  id: number;
  heading?: string | null;
  steps?: StrapiHowToApplyStep[] | null;
};

type StrapiHowToApplyLink = {
  id: number;
  title: string;
  url: string;
  isExternal?: boolean | null;
};

type StrapiHowToApplyLinksBlock = {
  id: number;
  heading?: string | null;
  links?: StrapiHowToApplyLink[] | null;
};

type StrapiHowToApplyData = {
  id: number;
  documentId: string;
  title?: string | null;
  steps?: StrapiHowToApplyStepsBlock | null;
  links?: StrapiHowToApplyLinksBlock | null;
};

type StrapiHowToApplyResponse = StrapiSingleResponse<StrapiHowToApplyData>;

export async function fetchHowToApplySection(): Promise<HowToApplySection | null> {
  const response = await strapiFetch<StrapiHowToApplyResponse>("how-to-apply", {
    params: {
      populate: {
        steps: {
          populate: "*",
        },
        links: {
          populate: "*",
        },
      },
    },
    next: { revalidate: 60 },
  });

  if (!response.data) {
    return null;
  }

  const stepsBlock = response.data.steps;
  const linksBlock = response.data.links;

  const steps: HowToApplyStep[] =
    stepsBlock?.steps?.map((step) => ({
      id: String(step.id),
      title: step.title,
      description: step.description ?? undefined,
    })) ?? [];

  const links: HowToApplyLink[] =
    linksBlock?.links?.map((link) => ({
      id: String(link.id),
      title: link.title,
      url: link.url,
      isExternal: link.isExternal,
    })) ?? [];

  return {
    heading: response.data.title ?? stepsBlock?.heading ?? "How To Apply",
    stepsHeading: stepsBlock?.heading ?? "Steps",
    steps,
    linksHeading: linksBlock?.heading ?? "Quick Links",
    links,
  };
}

