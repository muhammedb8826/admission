export type EventListItem = {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  summary: string;
  startDate: string;
  endDate?: string;
  location?: string;
  featuredImageUrl?: string;
  isFeatured?: boolean;
};

export type EventDetail = {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  summary: string;
  startDate: string;
  endDate?: string;
  location?: string;
  featuredImageUrl?: string;
  isFeatured?: boolean;
  content?: string;
};

