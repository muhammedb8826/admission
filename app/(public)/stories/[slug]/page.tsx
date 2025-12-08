import { notFound } from "next/navigation";
import { StoryDetailView, getStoryDetail } from "@/features/stories";
import { PageHeaderBanner } from "@/features/layout";

type StoryPageProps<T> = {
  params: Promise<T>;
};

export const revalidate = 60;

export default async function StoryPage({ params }: StoryPageProps<{ slug: string }>) {
  const { slug } = await params;

  let story = null;
  try {
    if (slug) {
      story = await getStoryDetail(slug);
    }
  } catch (error) {
    console.warn("Failed to load story detail for slug:", slug, error);
  }

  if (!story) {
    notFound();
  }

  return (
    <div className="w-full">
      <PageHeaderBanner
        title={story.title || "Story"}
        backgroundImageUrl="/images/hero-banner/banner.jpg"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Stories", href: "/stories" },
          { label: story.title || "Story Details" },
        ]}
      />
      <StoryDetailView story={story} />
    </div>
  );
}

