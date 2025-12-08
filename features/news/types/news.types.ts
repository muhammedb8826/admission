export type NewsListItem = {
  id: string;
  title: string;
  slug: string;
  publishedDate: string;
  summary: string;
  featuredImageUrl?: string;
  isFeatured?: boolean;
};

export type NewsDetail = {
  id: string;
  title: string;
  slug: string;
  publishedDate: string;
  summary: string;
  content: string;
  featuredImageUrl?: string;
  isFeatured?: boolean;
  // Placeholder for author - to be populated later
  author?: {
    name: string;
    avatar?: string;
  };
};

