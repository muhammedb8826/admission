"use client";

import Link from "next/link";
import { Mail, Phone, Facebook, Twitter, Linkedin, Youtube, Send } from "lucide-react";
import { GlobalData } from "../types/global.types";

type TopHeaderProps = {
  data: GlobalData["topHeader"];
};

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  telegram: Send,
};

export function TopHeader({ data }: TopHeaderProps) {
  console.log(data);
  return (
    <div className="hidden md:block border-b border-border bg-white text-(--brand-black)">
      <div className="container mx-auto px-4">
        <div className="flex h-10 items-center justify-between text-sm">
          {/* Left: Contact Info */}
          <div className="flex items-center gap-6">
            {data.email && (
              <a
                href={`mailto:${data.email}`}
                className="flex items-center gap-2 text-(--brand-black)/80 transition-colors hover:text-(--brand-accent)"
              >
                <Mail className="h-4 w-4" />
                <span>{data.email}</span>
              </a>
            )}
            {data.phone && (
              <a
                href={`tel:${data.phone}`}
                className="flex items-center gap-2 text-(--brand-black)/80 transition-colors hover:text-(--brand-accent)"
              >
                <Phone className="h-4 w-4" />
                <span>{data.phone}</span>
              </a>
            )}
          </div>

          {/* Right: Social Links + Auth Buttons */}
          <div className="flex items-center gap-4">
            {/* Social Media Icons */}
            <div className="flex items-center gap-3">
              {data.socialLinks.map((link, index) => {
                // Use SVG from Strapi if available, otherwise fall back to lucide-react icons
                if (link.iconData) {
                  return (
                    <a
                      key={link.platform || index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-(--brand-black)/60 transition-colors hover:text-(--brand-accent)"
                      aria-label={link.platform}
                      dangerouslySetInnerHTML={{
                        __html: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">${link.iconData}</svg>`,
                      }}
                    />
                  );
                }
                const Icon = socialIcons[link.platform.toLowerCase()];
                if (!Icon) return null;
                return (
                  <a
                    key={link.platform || index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--brand-black)/60 transition-colors hover:text-(--brand-accent)"
                    aria-label={link.platform}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>

            {/* Dynamic Buttons */}
            <div className="ml-2 flex items-center gap-2">
              {data.buttons.map((button, index) => (
                <Link
                  key={`${button.url}-${index}`}
                  href={button.url}
                  className={
                    button.isPrimary
                      ? "rounded bg-(--brand-green) px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-(--brand-accent)"
                      : "rounded border border-(--brand-black)/15 px-4 py-1.5 text-sm font-medium text-(--brand-black) transition-colors hover:text-(--brand-accent)"
                  }
                >
                  {button.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

