import { StoriesList, getStoriesList } from "@/features/stories";
import { PageHeaderBanner } from "@/features/layout";

export const revalidate = 60;

export default async function StoriesPage() {
  const stories = await getStoriesList();

  return (
    <div className="w-full">
      <PageHeaderBanner
        title="Stories"
        backgroundImageUrl="/images/hero-banner/banner.jpg"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Stories" },
        ]}
      />
      <StoriesList stories={stories} />
    </div>
  );
}

