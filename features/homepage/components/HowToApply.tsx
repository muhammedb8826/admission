import Link from "next/link";
import { HowToApplySection } from "../types/how-to-apply.types";

type Props = {
  section: HowToApplySection | null;
};

export function HowToApply({ section }: Props) {
  if (!section || (!section.steps?.length && !section.links?.length)) {
    return null;
  }

  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="mx-auto w-full  px-4 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
            Admission Guide
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

        <div className="grid gap-12 lg:grid-cols-2">
          {section.steps?.length ? (
            <div className="overflow-hidden rounded-2xl border bg-linear-to-br from-primary/5 via-primary/3 to-background shadow-sm">
              <div className="flex items-center justify-between px-5 py-5 sm:px-6">
                <h3 className="text-xl font-semibold text-foreground">
                  {section.stepsHeading || "Steps"}
                </h3>
              </div>
              <div className="relative pt-2 pb-4">
                {section.steps.length > 1 ? (
                  <div className="pointer-events-none absolute left-[30px] top-8 bottom-8 w-[3px] rounded bg-primary/50" />
                ) : null}

                <div className="divide-y divide-primary/5">
                  {section.steps.map((step, index) => {
                    return (
                      <div
                        key={step.id}
                        className="relative grid gap-4 px-5 py-6 transition hover:bg-white/40 sm:px-6"
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white text-primary font-semibold shadow-sm">
                            {index + 1}
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-foreground">
                              {step.title}
                            </h3>
                            {step.description ? (
                              <p className="text-sm text-muted-foreground">
                                {step.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {section.links?.length ? (
            <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {section.linksHeading || "Quick Links"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Quick actions to start your application.
                </p>
              </div>
              <div className="space-y-3">
                {section.links.map((link) => (
                  <Link
                    key={link.id}
                    href={link.url}
                    target={link.isExternal ? "_blank" : undefined}
                    rel={link.isExternal ? "noopener noreferrer" : undefined}
                    className="group flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span>{link.title}</span>
                    <span className="text-xs opacity-80 group-hover:opacity-100">
                      {link.isExternal ? "↗" : "→"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
