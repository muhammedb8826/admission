import { notFound } from "next/navigation";
import { CalendarDetailView } from "@/features/calendars/components/CalendarDetailView";
import { fetchCalendarDetail } from "@/features/calendars/services/calendar.service";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type CalendarDetailPageProps = {
  params: Promise<{ slug: string }>;
};
export const revalidate = 60;

export default async function CalendarDetailPage({
  params,
}: CalendarDetailPageProps) {
  const { slug } = await params;

  let calendarDetail = null;

  try {
    if (slug) {
      calendarDetail = await fetchCalendarDetail(slug);
    }
  } catch (error) {
    console.warn("Failed to load calendar detail for slug:", slug, error);
    notFound();
  }

  if (!calendarDetail) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="space-y-3 px-4 lg:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/calendar">
                Calendar
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{calendarDetail.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* <div>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">
            {calendarDetail.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            View the calendar for {calendarDetail.program?.name}{" "}
            {calendarDetail.batch?.name}.
          </p>
        </div> */}
      </div>
      <div className="px-4 lg:px-6">
        <Card>
          <CardContent className="p-6">
            <CalendarDetailView calendarDetail={calendarDetail} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
