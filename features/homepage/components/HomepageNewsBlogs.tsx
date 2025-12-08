"use client";

import Image from "next/image";
import Link from "next/link";
import type { HomepageNewsBlogsSection } from "../types/news-blogs.types";

type Props = {
  section: HomepageNewsBlogsSection | null;
};

export function HomepageNewsBlogs({ section }: Props) {
  if (!section || !section.news || section.news.length === 0) return null;

  const { heading, title, subTitle, news } = section;
  const displayNews = news.slice(0, 3); // Show max 3 news items

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
          {title && (
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
              {title}
            </h3>
          )}
          {subTitle && (
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {subTitle}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayNews.map((item) => {
            const formattedDate = new Date(item.publishedDate).toLocaleDateString(
              undefined,
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              }
            );

            return (
              <article
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {item.featuredImageUrl && (
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={item.featuredImageUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {formattedDate}
                  </p>
                  <h3 className="text-lg font-bold tracking-tight text-primary group-hover:text-primary/80 transition-colors line-clamp-2">
                    <Link href={`/news/${item.slug}`}>{item.title}</Link>
                  </h3>
                  <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                    {item.summary}
                  </p>
                  <div className="mt-auto pt-2">
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

        <div className="flex justify-center pt-4">
          <Link
            href="/news"
            className="inline-flex items-center rounded-md border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            See More News
            <span className="ml-1.5">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

