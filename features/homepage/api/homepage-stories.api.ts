import { fetchHomepageStories } from "../services/homepage-stories.service";
import type { HomepageStoriesData } from "../types/homepage-stories.types";

export async function getHomepageStories(): Promise<HomepageStoriesData> {
  return fetchHomepageStories();
}

