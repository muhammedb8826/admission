import { PageHeaderBanner } from "@/features/layout";
import { AlumniList, fetchAlumniList } from "@/features/alumni";

export default async function AlumniPage() {
  const alumni = await fetchAlumniList();

  return (
    <div className="w-full">
      <PageHeaderBanner
        title="Alumni"
        backgroundImageUrl="/images/hero-banner/banner.jpg"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Alumni" },
        ]}
      />

      <AlumniList alumni={alumni} />
    </div>
  );
}

