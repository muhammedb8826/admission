
import { CalendarsList } from "@/features/calendars/components/CalendarsList";

export default async function CalendarPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mx-auto max-w-6xl">
              <CalendarsList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
