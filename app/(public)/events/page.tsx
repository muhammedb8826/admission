import { EventsList, getEventsList } from "@/features/events";
import { PageHeaderBanner } from "@/features/layout";

export const revalidate = 60;

export default async function EventsPage() {
  const events = await getEventsList();

  return (
    <div className="w-full">
      <PageHeaderBanner
        title="Events"
        backgroundImageUrl="/images/hero-banner/banner.jpg"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Events" },
        ]}
      />
      <EventsList events={events} />
    </div>
  );
}

