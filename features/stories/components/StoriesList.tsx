"use client";

import Image from "next/image";
import Link from "next/link";
import type { StoryListItem } from "../types/stories.types";

type StoriesListProps = {
  stories: StoryListItem[];
};

export function StoriesList({ stories }: StoriesListProps) {
  if (!stories.length) {
    return (
      <section className="w-full py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center text-muted-foreground">
          No stories available yet.
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 space-y-8">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Alumni Stories
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Inspiring journeys and achievements from our alumni community.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <article
              key={story.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {story.featuredImageUrl && (
                <div className="relative h-52 w-full overflow-hidden">
                  <Image
                    src={story.featuredImageUrl}
                    alt={story.title || "Story image"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(min-width: 768px) 50vw, 100vw"
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
                <h2 className="text-xl font-semibold tracking-tight group-hover:text-primary">
                  <Link href={`/stories/${story.slug}`}>{story.title}</Link>
                </h2>
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
      </div>
    </section>
  );
}


