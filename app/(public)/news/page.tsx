import { NewsList, getNewsList } from "@/features/news";
import { PageHeaderBanner } from "@/features/layout";

export const revalidate = 60;

export default async function NewsPage() {
  const news = await getNewsList();

  return (
    <div className="w-full">
      <PageHeaderBanner
        title="News"
        backgroundImageUrl="/images/hero-banner/banner.jpg"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "News" },
        ]}
      />
      <NewsList news={news} />
    </div>
  );
}

