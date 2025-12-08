"use client";

import { WhyJoinSection } from "../types/why-join.types";

type Props = {
  section: WhyJoinSection | null;
};

function IconMarkup({ svg }: { svg?: string }) {
  if (!svg) return null;
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
      dangerouslySetInnerHTML={{
        __html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">${svg}</svg>`,
      }}
    />
  );
}

export function WhyYouShouldJoinSection({ section }: Props) {
  if (!section) return null;

  const { heading, subHeading, cards } = section;

  if (!heading && (!cards || cards.length === 0)) return null;

  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4">
        <div className="mx-auto max-w-3xl text-center space-y-4">
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

          {subHeading && (
            <p className="text-base md:text-lg text-muted-foreground">
              {subHeading}
            </p>
          )}
        </div>

        {cards && cards.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card/40 p-6 shadow-sm backdrop-blur-sm"
              >
                <IconMarkup svg={card.iconData} />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


