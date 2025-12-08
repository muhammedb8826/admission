export type HomepageCarouselItem = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  link?: {
    title: string;
    url: string;
    isExternal: boolean;
  };
};

