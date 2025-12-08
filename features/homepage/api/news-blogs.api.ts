import { fetchHomepageNewsBlogs } from "../services/news-blogs.service";
import type { HomepageNewsBlogsSection } from "../types/news-blogs.types";

export async function getHomepageNewsBlogs(): Promise<HomepageNewsBlogsSection | null> {
  return fetchHomepageNewsBlogs();
}

