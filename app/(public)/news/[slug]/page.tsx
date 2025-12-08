import { notFound } from "next/navigation";
import { NewsDetailView, getNewsDetail } from "@/features/news";
import { PageHeaderBanner } from "@/features/layout";

type NewsPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function NewsPage({ params }: NewsPageProps) {
  const { slug } = await params;

  let news = null;
  try {
    if (slug) {
      news = await getNewsDetail(slug);
    }
  } catch (error) {
    console.warn("Failed to load news detail for slug:", slug, error);
  }

  if (!news) {
    notFound();
  }

  return (
    <div className="w-full">
      <PageHeaderBanner
        title={news.title || "News"}
        backgroundImageUrl="/images/hero-banner/banner.jpg"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "News", href: "/news" },
          { label: news.title || "News Details" },
        ]}
      />
      <NewsDetailView news={news} />
    </div>
  );
}

