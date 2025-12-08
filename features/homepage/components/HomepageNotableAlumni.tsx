"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { HomepageNotableAlumniSection } from "../types/notable-alumni.types";

type Props = {
  section: HomepageNotableAlumniSection | null;
};

export function HomepageNotableAlumni({ section }: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [cardsPerPage, setCardsPerPage] = React.useState(3);
  const [isPaused, setIsPaused] = React.useState(false);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateCardsPerPage = () => {
      if (window.innerWidth < 768) {
        setCardsPerPage(1); // Mobile: 1 card
      } else if (window.innerWidth < 1024) {
        setCardsPerPage(2); // Tablet: 2 cards
      } else {
        setCardsPerPage(3); // Desktop: 3 cards
      }
    };

    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);
    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, []);

  // Auto-slide functionality
  React.useEffect(() => {
    if (!section?.alumni || section.alumni.length === 0) return;
    
    const alumniCount = section.alumni.length;
    const maxIndex = Math.max(0, alumniCount - cardsPerPage);
    // Only auto-slide if there are more items than visible cards
    if (maxIndex <= 0 || isPaused) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= maxIndex) return 0;
        return prev + 1;
      });
    }, 4000); // Auto-slide every 4 seconds

    return () => clearInterval(interval);
  }, [section, cardsPerPage, isPaused]);

  if (!section) return null;

  const { heading, subHeading, alumni } = section;

  if (!alumni || alumni.length === 0) return null;

  const total = alumni.length;

  const goNext = () => {
    setActiveIndex((prev) => {
      const maxIndex = Math.max(0, total - cardsPerPage);
      if (prev >= maxIndex) return 0;
      return prev + 1;
    });
  };

  const goPrev = () => {
    setActiveIndex((prev) => {
      const maxIndex = Math.max(0, total - cardsPerPage);
      if (prev <= 0) return maxIndex;
      return prev - 1;
    });
  };

  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 space-y-10">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
              {heading}
            </h2>
            <div className="flex justify-center">
              <svg
                width="140"
                height="16"
                viewBox="0 0 140 16"
                aria-hidden="true"
                className="text-amber-400"
              >
                <path
                  d="M2 10c12 6 24-6 36 0s24 6 36 0 24-6 36 0 18 6 28 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          {subHeading && (
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {subHeading}
            </p>
          )}
        </div>

        {/* Card Carousel */}
        <div 
          ref={carouselRef}
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Previous Button - Overlaid on left */}
          {total > cardsPerPage && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-0 top-1/2 z-20 -translate-y-1/2 -translate-x-4 md:-translate-x-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/70 bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Previous alumni"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </button>
          )}

          <div className="mx-auto max-w-6xl overflow-hidden px-2">
            <div
              className="flex gap-6 transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${activeIndex * (100 / cardsPerPage)}%)`,
              }}
            >
              {alumni.map((person) => (
                <div
                  key={person.id}
                  className="min-w-0 shrink-0"
                  style={{ width: `${100 / cardsPerPage}%` }}
                >
                  <Link
                    href={`/alumni/${person.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white border border-border shadow-sm transition hover:shadow-md"
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
                        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 to-primary/5">
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
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition">
                        {person.fullName}
                      </h3>
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
                </div>
              ))}
            </div>
          </div>

          {/* Next Button - Overlaid on right */}
          {total > cardsPerPage && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-4 md:translate-x-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/70 bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Next alumni"
            >
              <ArrowRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
