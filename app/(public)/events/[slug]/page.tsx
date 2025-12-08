import { notFound } from "next/navigation";
import { EventDetailView, getEventDetail } from "@/features/events";
import { PageHeaderBanner } from "@/features/layout";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;

  let event = null;
  try {
    if (slug) {
      event = await getEventDetail(slug);
    }
  } catch (error) {
    console.warn("Failed to load event detail for slug:", slug, error);
  }

  if (!event) {
    notFound();
  }

  return (
    <div className="w-full">
      <PageHeaderBanner
        title={event.title || "Event"}
        backgroundImageUrl="/images/hero-banner/banner.jpg"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Events", href: "/events" },
          { label: event.title || "Event Details" },
        ]}
      />
      <EventDetailView event={event} />
    </div>
  );
}

