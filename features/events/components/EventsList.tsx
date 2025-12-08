"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import type { EventListItem } from "../types/events.types";

type EventsListProps = {
  events: EventListItem[];
};

export function EventsList({ events }: EventsListProps) {
  if (!events.length) {
    return (
      <section className="w-full py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center text-muted-foreground">
          No events available yet.
        </div>
      </section>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString().padStart(2, "0"),
      month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section className="w-full py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const startDate = formatDate(event.startDate);
            const startTime = formatTime(event.startDate);

            return (
              <article
                key={event.id}
                className="group relative flex flex-col overflow-hidden rounded-lg border-l-4 border-b-4 border-l-primary border-b-primary bg-card shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Image section */}
                {event.featuredImageUrl && (
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <Image
                      src={event.featuredImageUrl}
                      alt={event.title || "Event image"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                    {event.isFeatured && (
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
                        Featured
                      </div>
                    )}
                  </div>
                )}

                {/* Content section */}
                <div className="flex flex-1 flex-col gap-4 p-5 bg-white">
                  {/* Date display - prominent */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col shrink-0">
                      <span className="text-4xl font-bold leading-none text-foreground">
                        {startDate.day}
                      </span>
                      <span className="text-sm font-bold text-foreground mt-1">
                        {startDate.month}
                      </span>
                    </div>

                    {/* Title with accent underline */}
                    <div className="flex-1 pt-1">
                      <h2 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 border-b-2 border-b-primary/30 pb-1">
                        <Link href={`/events/${event.slug}`}>{event.title}</Link>
                      </h2>
                    </div>
                  </div>

                  {/* Location and time */}
                  <div className="space-y-2">
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{startTime}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {(event.shortDescription || event.summary) && (
                    <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                      {event.shortDescription || event.summary}
                    </p>
                  )}

                  {/* Learn more link */}
                  <div className="mt-auto pt-2">
                    <Link
                      href={`/events/${event.slug}`}
                      className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Learn more
                      <span className="ml-1">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

