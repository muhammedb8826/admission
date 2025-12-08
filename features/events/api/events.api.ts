import { fetchEventsList, fetchEventBySlug } from "../services/events.service";
import type { EventListItem, EventDetail } from "../types/events.types";

export async function getEventsList(): Promise<EventListItem[]> {
  return fetchEventsList();
}

export async function getEventDetail(slug: string): Promise<EventDetail | null> {
  return fetchEventBySlug(slug);
}

