"use client";

import Image from "next/image";
import Link from "next/link";
import type { AlumniListItem } from "../types/alumni.types";

type AlumniListProps = {
  alumni: AlumniListItem[];
  showAll?: boolean;
  hideHeader?: boolean;
};

export function AlumniList({ alumni, showAll = false, hideHeader = false }: AlumniListProps) {
  const hasAlumni = alumni.length > 0;

  if (!hasAlumni) {
    return (
      <section className="w-full py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center text-muted-foreground">
          No alumni have registered yet.
        </div>
      </section>
    );
  }

  const displayAlumni = showAll ? alumni : alumni.slice(0, Math.min(6, alumni.length));
  const hasMore = !showAll && alumni.length > 6;

  return (
    <section className="w-full py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 space-y-8">
        {!hideHeader && (
          <header className="space-y-3 text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Our Alumni
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              A growing community of graduates making an impact around the world.
            </p>
          </header>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayAlumni.map((person) => (
            <Link
              key={person.id}
              href={`/alumni/${person.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-border shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {/* Image Section */}
              <div className="relative h-64 w-full bg-primary/5 overflow-hidden">
                {person.profileImageUrl ? (
                  <Image
                    src={person.profileImageUrl}
                    alt={person.fullName}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <span className="text-4xl font-bold">
                        {person.fullName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((name) => name[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Section */}
              <div className="p-6 space-y-2">
                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition">
                  {person.fullName}
                </h2>
                {(person.jobTitle || person.companyName) && (
                  <p className="text-sm text-primary line-clamp-2">
                    {[person.jobTitle, person.companyName].filter(Boolean).join(" · ")}
                  </p>
                )}
                {person.location && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {person.location}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center pt-2">
            <Link
              href="/alumni/all"
              className="inline-flex items-center rounded-md border border-primary bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              See all alumni
              <span className="ml-1.5">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
