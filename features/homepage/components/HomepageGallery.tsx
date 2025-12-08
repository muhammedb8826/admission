"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { HomepageGallerySection } from "../types/gallery.types";

type Props = {
  section: HomepageGallerySection | null;
};

export function HomepageGallery({ section }: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (!section) return null;

  const { heading, title, subTitle, images } = section;

  if (!images || images.length === 0) return null;

  const total = images.length;

  const goNext = () => setActiveIndex((prev) => (prev + 1) % total);
  const goPrev = () => setActiveIndex((prev) => (prev - 1 + total) % total);

  return (
    <section className="w-full overflow-hidden py-16 md:py-24 bg-background">
      {/* Slightly wider than other sections to give the carousel more breathing room */}
      <div className="mx-auto w-full max-w-7xl px-4 space-y-10">
        <div className="text-center space-y-4">
          {heading && (
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
          )}
          {title && (
            <p className="text-lg md:text-xl font-semibold tracking-tight">
              {title}
            </p>
          )}
          {subTitle && (
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {subTitle}
            </p>
          )}
        </div>

        {/* Carousel */}
        <div className="relative mx-auto flex h-[340px] w-full max-w-6xl items-center justify-center overflow-hidden md:h-[400px]">
          {images.map((image, index) => {
            // Compute relative position around the active slide (-2 to +2)
            let delta = (index - activeIndex + total) % total;
            if (delta > total / 2) delta -= total; // normalize to negative side as needed

            let positionClass = "opacity-0 pointer-events-none";
            let containerClass = "translate-x-0 scale-100";

            if (delta === 0) {
              // center card
              positionClass = "z-30 opacity-100 pointer-events-auto";
              containerClass = "translate-x-0 scale-100 shadow-2xl";
            } else if (delta === 1) {
              // immediate right
              positionClass = "z-20 opacity-100 pointer-events-none";
              containerClass = "translate-x-24 md:translate-x-32 scale-95";
            } else if (delta === -1) {
              // immediate left
              positionClass = "z-20 opacity-100 pointer-events-none";
              containerClass = "-translate-x-24 md:-translate-x-32 scale-95";
            } else if (delta === 2) {
              // far right
              positionClass = "z-10 opacity-70 pointer-events-none";
              containerClass = "translate-x-40 md:translate-x-56 scale-90";
            } else if (delta === -2) {
              // far left
              positionClass = "z-10 opacity-70 pointer-events-none";
              containerClass = "-translate-x-40 md:-translate-x-56 scale-90";
            } else {
              // all other slides hidden
              return null;
            }

            return (
              <div
                key={image.id ?? index}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${positionClass}`}
              >
                <figure
                  className={`relative h-full w-[75%] max-w-3xl overflow-hidden rounded-3xl border border-border bg-card ${containerClass}`}
                >
                  <div className="relative h-full w-full overflow-hidden">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 640px, 100vw"
                    />
                  </div>
                </figure>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/70 bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Previous image"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/70 bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Next image"
            >
              <ArrowRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

