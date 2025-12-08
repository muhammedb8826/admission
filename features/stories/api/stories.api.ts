import { fetchStoriesList, fetchStoryBySlug } from "../services/stories.service";
import type { StoryListItem, StoryDetail } from "../types/stories.types";

export async function getStoriesList(): Promise<StoryListItem[]> {
  return fetchStoriesList();
}

export async function getStoryDetail(slug: string): Promise<StoryDetail | null> {
  return fetchStoryBySlug(slug);
}


