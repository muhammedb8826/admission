"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Mail, Phone, X } from "lucide-react";
import { GlobalData } from "../types/global.types";

type HeaderProps = {
  data: GlobalData["header"];
  topHeaderData: GlobalData["topHeader"];
  siteName: string;
};

export function Header({ data, topHeaderData, siteName }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              {data.logo && (
                <div className="relative h-12 w-auto shrink-0">
                  <Image
                    src={data.logo.url}
                    width={192}
                    height={192}
                    alt={data.logo.alternativeText || siteName}
                    className="object-contain"
                    sizes="192px"
                  />
                </div>
              )}
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {data.navigationLinks.map((link) => (
                <Link
                  key={link.url}
                  href={link.url}
                  className="text-sm font-medium transition-colors whitespace-nowrap text-white hover:text-(--brand-accent)"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:opacity-80 rounded transition-opacity w-10 h-10 flex items-center justify-center"
              aria-label="Menu"
              onClick={() => setIsMenuOpen(true)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-primary text-primary-foreground shadow-xl overflow-y-auto">
            <div className="flex flex-col h-full">
              {/* Close Button */}
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-full bg-(--brand-black) text-(--brand-accent) hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-6 py-4">
                <div className="flex flex-col gap-1">
                  {data.navigationLinks.map((link) => (
                    <Link
                      key={link.url}
                      href={link.url}
                      className="text-lg font-medium py-3 transition-colors hover:text-(--brand-accent)"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Contact Section */}
              <div className="px-6 py-6 border-t border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-medium">Contact us</span>
                  <span className="text-lg">→</span>
                </div>
                
                {topHeaderData.email && (
                    <a
                      href={`mailto:${topHeaderData.email}`}
                      className="flex items-center gap-3 py-2 text-base transition-colors hover:text-(--brand-accent)"
                    onClick={() => setIsMenuOpen(false)}
                  >
                      <Mail className="h-5 w-5" />
                    <span>{topHeaderData.email}</span>
                  </a>
                )}
                
                {topHeaderData.phone && (
                    <a
                      href={`tel:${topHeaderData.phone}`}
                      className="flex items-center gap-3 py-2 text-base transition-colors hover:text-(--brand-accent)"
                    onClick={() => setIsMenuOpen(false)}
                  >
                      <Phone className="h-5 w-5" />
                    <span>{topHeaderData.phone}</span>
                  </a>
                )}
              </div>

              {/* Auth Buttons */}
              <div className="px-6 pb-6 flex gap-3">
                {topHeaderData.loginButton && (
                  <Link
                    href={topHeaderData.loginButton.url}
                    className="flex-1 rounded-lg bg-(--brand-black) px-4 py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {topHeaderData.loginButton.label}
                  </Link>
                )}
                {topHeaderData.registerButton && (
                  <Link
                    href={topHeaderData.registerButton.url}
                    className="flex-1 rounded-lg bg-(--brand-green) px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-(--brand-accent)"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {topHeaderData.registerButton.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

