import { notFound } from "next/navigation";
import { PageHeaderBanner } from "@/features/layout";
import { AlumniDetailView, fetchAlumniBySlug } from "@/features/alumni";

type AlumniDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function AlumniDetailPage({ params }: AlumniDetailPageProps) {
  const { slug } = await params;

  let alumni = null;
  try {
    if (slug) {
      alumni = await fetchAlumniBySlug(slug);
      if (!alumni) {
        console.warn(`Alumni not found for slug: ${slug}`);
      }
    }
  } catch (error) {
    console.error("Failed to load alumni detail for slug:", slug, error);
  }

  if (!alumni) {
    notFound();
  }

  return (
    <div className="w-full">
      <PageHeaderBanner
        title={alumni.fullName}
        backgroundImageUrl="/images/hero-banner/banner.jpg"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Alumni", href: "/alumni" },
          { label: alumni.fullName },
        ]}
      />
      <AlumniDetailView alumni={alumni} />
    </div>
  );
}

