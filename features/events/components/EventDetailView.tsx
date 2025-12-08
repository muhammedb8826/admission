"use client";

import Image from "next/image";
import { Calendar, MapPin, Clock } from "lucide-react";
import type { EventDetail } from "../types/events.types";

type EventDetailViewProps = {
  event: EventDetail;
};

export function EventDetailView({ event }: EventDetailViewProps) {
  const formatEventDate = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const startFormatted = start.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (endDate) {
      const end = new Date(endDate);
      const endFormatted = end.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      return `${startFormatted} - ${endFormatted}`;
    }

    return startFormatted;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <article className="w-full py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 space-y-8">
        <header className="space-y-4">
          {event.isFeatured && (
            <div className="inline-flex items-center bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
              Featured Event
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {event.title}
          </h1>

          {/* Event metadata */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatEventDate(event.startDate, event.endDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Time</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(event.startDate)}
                  {event.endDate && ` - ${formatTime(event.endDate)}`}
                </p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Location</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {event.featuredImageUrl && (
          <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border bg-card">
            <Image
              src={event.featuredImageUrl}
              alt={event.title || "Event image"}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 768px, 100vw"
            />
          </div>
        )}

        {event.shortDescription && (
          <div className="prose prose-sm md:prose-base max-w-none">
            <p className="text-lg font-medium text-foreground leading-relaxed">
              {event.shortDescription}
            </p>
          </div>
        )}

        <section className="prose prose-sm md:prose-base max-w-none text-muted-foreground prose-headings:text-foreground">
          <p style={{ whiteSpace: "pre-line" }}>{event.summary}</p>
        </section>
      </div>
    </article>
  );
}

