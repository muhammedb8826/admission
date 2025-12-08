import { fetchHomepageCarouselItems } from "../services/carousel.service";
import { HomepageCarouselItem } from "../types/carousel.types";

export async function getHomepageCarouselItems(): Promise<HomepageCarouselItem[]> {
  return fetchHomepageCarouselItems();
}

