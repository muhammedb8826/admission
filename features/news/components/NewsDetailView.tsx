"use client";

import Image from "next/image";
import type { NewsDetail } from "../types/news.types";

type NewsDetailViewProps = {
  news: NewsDetail;
};

export function NewsDetailView({ news }: NewsDetailViewProps) {
  return (
    <article className="w-full py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {new Date(news.publishedDate).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {news.title}
          </h1>
          {/* Author placeholder */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
            <span>By</span>
            {news.author?.avatar ? (
              <div className="flex items-center gap-2">
                <Image
                  src={news.author.avatar}
                  alt={news.author.name || "Author avatar"}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span className="font-medium">{news.author.name}</span>
              </div>
            ) : (
              <span className="font-medium">{news.author?.name || "Admin"}</span>
            )}
          </div>
        </header>

        {news.featuredImageUrl && (
          <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border bg-card">
            <Image
              src={news.featuredImageUrl}
              alt={news.title || "Featured image"}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 768px, 100vw"
            />
          </div>
        )}

        <section className="prose prose-sm md:prose-base max-w-none text-muted-foreground prose-headings:text-foreground">
          <p style={{ whiteSpace: "pre-line" }}>{news.summary}</p>
        </section>
      </div>
    </article>
  );
}

