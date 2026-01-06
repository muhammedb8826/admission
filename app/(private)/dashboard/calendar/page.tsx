import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarsList } from "@/features/calendars/components/CalendarsList";

export default async function CalendarPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="space-y-3 px-4 lg:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Calendar</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              Calendar
            </h1>
            <p className="text-sm text-muted-foreground">
              View calendars sorted by program and batch. Click on a calendar to see the semesters and courses.
            </p>
          </div>
        </div>
        <div className="px-4 lg:px-6">
          <Card>
            <CardContent className="p-6">
              <CalendarsList />
              </CardContent>
          </Card>
        </div>
      </div>
  );
}
