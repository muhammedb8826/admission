import { fetchNewsList, fetchNewsBySlug } from "../services/news.service";
import type { NewsListItem, NewsDetail } from "../types/news.types";

export async function getNewsList(): Promise<NewsListItem[]> {
  return fetchNewsList();
}

export async function getNewsDetail(slug: string): Promise<NewsDetail | null> {
  return fetchNewsBySlug(slug);
}

