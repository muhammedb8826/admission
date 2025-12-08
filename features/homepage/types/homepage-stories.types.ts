import type { StoryListItem } from "@/features/stories/types/stories.types";

export type HomepageStoriesCard = {
  id: string;
  number?: number;
  description?: string;
  title?: string;
  // Allow for additional fields
  [key: string]: unknown;
};

export type SuccessStoriesSection = {
  title: string;
  stories: StoryListItem[];
};

export type AlumniSuccessStoriesSection = {
  title: string;
  subTitle?: string;
  cards: HomepageStoriesCard[];
};

export type HomepageStoriesData = {
  // Wrapper title for the whole stories section (e.g. "Stories")
  heading?: string;
  successStories?: SuccessStoriesSection;
  alumniSuccessStories?: AlumniSuccessStoriesSection;
};

