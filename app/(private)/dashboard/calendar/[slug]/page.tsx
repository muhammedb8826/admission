import { notFound } from "next/navigation"
import { CalendarDetailView } from "@/features/calendars/components/CalendarDetailView"
import { fetchCalendarDetail } from "@/features/calendars/services/calendar.service"

type CalendarDetailPageProps = {
  params: Promise<{ slug: string }>;
};
export const revalidate = 60;

export default async function CalendarDetailPage({ params }: CalendarDetailPageProps) {

  const { slug } = await params

  let calendarDetail= null;

  try {
    if (slug) {
      calendarDetail = await fetchCalendarDetail(slug)
    }
  } catch (error) {
    console.warn("Failed to load calendar detail for slug:", slug, error)
    notFound()
  }


  if (!calendarDetail) {
    notFound()
  }

  return <CalendarDetailView calendarDetail={calendarDetail} />
}
