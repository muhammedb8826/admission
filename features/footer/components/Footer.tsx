"use client";

import Link from "next/link";
import { ChevronsUp } from "lucide-react";
import { GlobalData } from "@/features/header/types/global.types";

type FooterProps = {
  data: GlobalData["footer"];
  siteName: string;
  siteDescription: string;
};

function normalizeHref(url?: string) {
  if (!url) return "#";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:")
  ) {
    return url;
  }
  if (url.includes("@")) {
    return `mailto:${url}`;
  }
  if (/^\+?\d/.test(url)) {
    return `tel:${url.replace(/\s+/g, "")}`;
  }
  return url;
}

function IconMarkup({ svg }: { svg?: string }) {
  if (!svg) return null;
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-5 w-5 items-center justify-center text-white"
      dangerouslySetInnerHTML={{
        __html: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">${svg}</svg>`,
      }}
    />
  );
}

export function Footer({ data, siteName, siteDescription }: FooterProps) {
  const fallbackDescription = siteDescription || "Connecting alumni and fostering lifelong relationships.";
  const handleScrollTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-white/5 bg-[#0c0d0f] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* About */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold tracking-wide text-white">{data.about?.title || siteName || "About"}</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              {data.about?.description || fallbackDescription}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white">{data.quickLinks.title || "Quick Links"}</h4>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {data.quickLinks.links.map((link) => {
                const href = normalizeHref(link.url);
                const isInternal = href.startsWith("/");

                const content = (
                  <span className="flex items-center gap-2">
                  <span className="text-(--brand-accent)">•</span>
                    <span>{link.label}</span>
                  </span>
                );

                if (isInternal && !link.isExternal) {
                  return (
                    <li key={`quick-link-${link.label}-${href}`}>
                      <Link href={href} className="transition-colors hover:text-(--brand-accent)">
                        {content}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={`quick-link-${link.label}-${href}`}>
                    <a
                      href={href}
                      target={link.isExternal ? "_blank" : undefined}
                      rel={link.isExternal ? "noopener noreferrer" : undefined}
                      className="transition-colors hover:text-(--brand-accent)"
                    >
                      {content}
                    </a>
                  </li>
                );
              })}
              {data.quickLinks.links.length === 0 && (
                <li className="text-white/60">Links coming soon.</li>
              )}
            </ul>
          </div>

  {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white">{data.contactInformation.title || "Contact Us"}</h4>
            <div className="mt-4 space-y-3 text-sm text-white/80">
              {data.contactInformation.address && (
                <p className="flex gap-2">
                  <span className="text-(--brand-accent)">•</span>
                  <span>{data.contactInformation.address.trim()}</span>
                </p>
              )}
              {data.contactInformation.contacts.map((contact, index) => (
                <div key={`contact-${contact.label}-${index}`} className="flex items-start gap-3">
                  <IconMarkup svg={contact.iconData} />
                  {contact.url ? (
                    <a href={normalizeHref(contact.url)} className="transition-colors hover:text-(--brand-accent)">
                      {contact.label || contact.url}
                    </a>
                  ) : (
                    <span>{contact.label}</span>
                  )}
                </div>
              ))}
              {data.contactInformation.contacts.length === 0 && (
                <p className="text-white/60">Contact information coming soon.</p>
              )}
            </div>
          </div>

          {/* Follow Us */}
          <div>
            <h4 className="text-lg font-semibold text-white">{data.followUs.title || "Follow Us"}</h4>
            <div className="mt-4 flex flex-wrap gap-3">
              {data.followUs.socialLinks.map((social, index) => (
                <a
                  key={`social-${social.url}-${index}`}
                  href={social.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-(--brand-accent)"
                  aria-label={social.iconName}
                >
                  <IconMarkup svg={social.iconData} />
                  {!social.iconData && <span className="text-xs font-medium">{social.iconName || "@"}</span>}
                </a>
              ))}
              {data.followUs.socialLinks.length === 0 && (
                <span className="text-sm text-white/70">Social links coming soon.</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={handleScrollTop}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-(--brand-accent) text-[#0c0d0f] shadow-lg transition hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            aria-label="Back to top"
          >
            <ChevronsUp className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-6 border-t border-white/10 pt-6 text-center text-sm text-white/60">
          {data.copyRight || "© DADU Admission. All rights reserved."}
        </div>
      </div>
    </footer>
  );
}

