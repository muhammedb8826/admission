"use client";

import Image from "next/image";
import Link from "next/link";
import { HomepageStoriesData } from "../types/homepage-stories.types";

type Props = {
  data: HomepageStoriesData;
};

export function HomepageStoriesSection({ data }: Props) {
  const { heading, successStories, alumniSuccessStories } = data;

  // Debug: log the data to see what we're getting
  if (typeof window !== "undefined") {
    console.log("HomepageStoriesSection data:", data);
  }

  // Don't render if both sections are empty
  const hasSuccessStories = successStories && successStories.stories.length > 0;
  const hasAlumniStories = alumniSuccessStories && 
    (alumniSuccessStories.cards?.length > 0 || alumniSuccessStories.title);

  if (!hasSuccessStories && !hasAlumniStories) return null;

  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 space-y-10">
        {heading && (
          <div className="text-center space-y-2">
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

        <div className="grid gap-12 lg:grid-cols-2">
        {/* Success Stories Section (left on large screens) */}
        {successStories && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {successStories.title || "Success Stories"}
              </h3>
            </div>

            {successStories.stories.length > 0 ? (
              <div className="space-y-6">
                {successStories.stories.slice(0, 2).map((story) => (
                  <article
                    key={story.id}
                    className="group flex flex-col md:flex-row overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    {story.featuredImageUrl && (
                      <div className="relative h-56 w-full md:h-auto md:w-56 lg:w-64 shrink-0 overflow-hidden">
                        <Image
                          src={story.featuredImageUrl}
                          alt={story.title || "Story image"}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(min-width: 1024px) 256px, (min-width: 768px) 224px, 100vw"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {new Date(story.publishedDate).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <h3 className="text-lg md:text-xl font-semibold tracking-tight group-hover:text-primary line-clamp-2">
                        <Link href={`/stories/${story.slug}`}>{story.title}</Link>
                      </h3>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {story.summary}
                      </p>
                      <div className="mt-auto pt-2">
                        <Link
                          href={`/stories/${story.slug}`}
                          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
                        >
                          Read story
                          <span className="ml-1">→</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No stories available yet.
              </div>
            )}
          </div>
        )}

        {/* Alumni Success Stories Section (right on large screens) */}
        {alumniSuccessStories && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {alumniSuccessStories.title || "Alumni Success Stories"}
              </h3>
              {alumniSuccessStories.subTitle && (
                <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
                  {alumniSuccessStories.subTitle}
                </p>
              )}
            </div>

            {alumniSuccessStories.cards && alumniSuccessStories.cards.length > 0 && (
              <div className="grid gap-6 md:grid-cols-3">
                {alumniSuccessStories.cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex flex-col items-center text-center gap-3 rounded-2xl border border-border bg-card/40 p-8 shadow-sm backdrop-blur-sm"
                  >
                    {card.number !== undefined && (
                      <div className="text-4xl md:text-5xl font-bold text-primary">
                        {card.number}
                      </div>
                    )}
                    {(card.description || card.title) && (
                      <h3 className="text-lg font-semibold tracking-tight">
                        {card.description || card.title}
                      </h3>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </section>
  );
}

