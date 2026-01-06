import { fetchCalendarDetail, fetchCalendarList } from "@/features/calendars/services/calendar.service";
import type { CalendarListItem } from "../types/calendar.types";

export async function getCalendarList(): Promise<CalendarListItem[]> {
  return fetchCalendarList();
}

export async function getCalendarDetail(slug: string): Promise<CalendarListItem | null> {
  return fetchCalendarDetail(slug);
}