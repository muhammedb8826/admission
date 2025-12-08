"use client";

import Image from "next/image";
import type { StoryDetail } from "../types/stories.types";

type StoryDetailViewProps = {
  story: StoryDetail;
};

export function StoryDetailView({ story }: StoryDetailViewProps) {
  return (
    <article className="w-full py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {new Date(story.publishedDate).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {story.title}
          </h1>
        </header>

        {story.featuredImageUrl && (
          <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border bg-card">
            <Image
              src={story.featuredImageUrl}
              alt={story.title || "Featured image"}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 768px, 100vw"
            />
          </div>
        )}

        <section className="prose prose-sm md:prose-base max-w-none text-muted-foreground prose-headings:text-foreground">
          <p style={{ whiteSpace: "pre-line" }}>{story.summary}</p>
        </section>
      </div>
    </article>
  );
}


