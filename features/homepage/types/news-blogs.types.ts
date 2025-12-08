export type NewsBlogItem = {
  id: string;
  documentId?: string;
  title: string;
  slug: string;
  publishedDate: string;
  summary: string;
  featuredImageUrl?: string;
  isFeatured?: boolean;
};

export type HomepageNewsBlogsSection = {
  heading: string;
  title: string;
  subTitle?: string;
  news: NewsBlogItem[];
};

