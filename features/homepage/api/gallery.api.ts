import { fetchHomepageGallerySection } from "../services/gallery.service";
import type { HomepageGallerySection } from "../types/gallery.types";

export async function getHomepageGallerySection(): Promise<HomepageGallerySection | null> {
  return fetchHomepageGallerySection();
}


