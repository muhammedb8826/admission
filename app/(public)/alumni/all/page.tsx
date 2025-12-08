import { PageHeaderBanner } from "@/features/layout";
import { AlumniList, fetchAlumniList } from "@/features/alumni";

export default async function AllAlumniPage() {
  const alumni = await fetchAlumniList();

  return (
    <div className="w-full">
      <PageHeaderBanner
        title="All Alumni"
        backgroundImageUrl="/images/hero-banner/banner.jpg"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Alumni", href: "/alumni" },
          { label: "All Alumni" },
        ]}
      />

      <AlumniList alumni={alumni} showAll={true} hideHeader={true} />
    </div>
  );
}

