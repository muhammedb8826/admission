"use client";

import Image from "next/image";
import Link from "next/link";
import type { NewsListItem } from "../types/news.types";

type NewsListProps = {
  news: NewsListItem[];
};

export function NewsList({ news }: NewsListProps) {
  if (!news.length) {
    return (
      <section className="w-full py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center text-muted-foreground">
          No news available yet.
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => {
            const formattedDate = new Date(item.publishedDate).toLocaleDateString(
              undefined,
              {
                month: "short",
                day: "numeric",
              }
            );

            return (
              <article
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-xl border-2 border-border/50 bg-card/50 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                {item.featuredImageUrl && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={item.featuredImageUrl}
                      alt={item.title || "News item image"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                    {/* Date badge overlay on image */}
                    <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg shadow-lg">
                      <p className="text-xs font-bold">{formattedDate}</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h2 className="text-lg font-bold tracking-tight text-primary group-hover:text-primary/80 transition-colors line-clamp-2">
                    <Link href={`/news/${item.slug}`}>{item.title}</Link>
                  </h2>
                  <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                    {item.summary}
                  </p>
                  {/* Author placeholder */}
                  <div className="mt-auto pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>By</span>
                    <span className="font-medium">Admin</span>
                  </div>
                  <div className="pt-1">
                    <Link
                      href={`/news/${item.slug}`}
                      className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      READ MORE
                      <span className="ml-1.5">→</span>
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

