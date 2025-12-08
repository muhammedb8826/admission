"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Crumb = {
  label: string;
  href?: string;
};

type PageHeaderBannerProps = {
  title: string;
  description?: string;
  crumbs: Crumb[];
  /**
   * Optional background image URL for the banner.
   * If not provided, a branded gradient pattern is used.
   */
  backgroundImageUrl?: string;
};

export function PageHeaderBanner({
  title,
  crumbs,
  backgroundImageUrl,
}: PageHeaderBannerProps) {
  // Ensure title is always a string
  const safeTitle = title || "Page";
  const lastIndex = crumbs?.length ? crumbs.length - 1 : -1;

  return (
    <section className="relative w-full border-b border-border overflow-hidden from-white to-[#f5f6fb]">
      {/* Background image / pattern */}
      {backgroundImageUrl && (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          aria-hidden="true"
        />
      )}

      {/* Dark overlay to keep content readable on top of the image */}
      <div className="pointer-events-none absolute inset-0 bg-black/60" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[220px] w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-10 text-center md:min-h-[260px] md:py-14">
        {crumbs && crumbs.length > 0 && (
          <Breadcrumb className="text-white/70 w-full max-w-full">
            <BreadcrumbList className="justify-center flex-wrap">
              {crumbs.map((crumb, index) => {
                const isLast = index === lastIndex;
                // Safely handle null/undefined labels - ensure it's always a string
                // For the last item, use the page title as fallback if label is empty
                const label = String(crumb?.label || (isLast ? safeTitle : "") || "");
                // Truncate long titles in breadcrumb (keep full in h1)
                const displayLabel = isLast && label && label.length > 50
                  ? `${label.substring(0, 47)}...`
                  : label;

                // Skip rendering if label is empty (except for last item which should always show)
                if (!label && !isLast) return null;

                return (
                  <React.Fragment key={`${label}-${index}`}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem className="max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                      {isLast || !crumb.href ? (
                        <BreadcrumbPage className="font-semibold text-primary truncate" title={label}>
                          {displayLabel}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={crumb.href}
                          className="text-white/80 hover:text-white truncate"
                          title={label}
                        >
                          {displayLabel}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        <div className="space-y-3 w-full">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-sm max-w-4xl mx-auto px-4">
            {safeTitle}
          </h1>
        </div>
      </div>
    </section>
  );
}


