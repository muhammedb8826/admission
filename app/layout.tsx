import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { getStrapiURL } from "@/lib/strapi/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type StrapiGlobal = {
  data?: {
    siteName?: string;
    siteDescription?: string;
    defaultSeo?: {
      metaTitle?: string;
      metaDescription?: string;
    } | null;
    favicon?: {
      url: string;
      alternativeText?: string | null;
    } | null;
  };
};

async function fetchGlobal(): Promise<StrapiGlobal> {
  const base = getStrapiURL();
  if (!base) return {};
  try {
    const res = await fetch(`${base}/api/global?populate[favicon]=*`, {
      // revalidate periodically but keep build from failing
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const global = await fetchGlobal();
  const siteName =
    global.data?.defaultSeo?.metaTitle ||
    global.data?.siteName ||
    "DADU Admission";
  const description =
    global.data?.defaultSeo?.metaDescription ||
    global.data?.siteDescription ||
    "Admission";

  const faviconUrl = global.data?.favicon?.url
    ? new URL(global.data.favicon.url, getStrapiURL()).toString()
    : undefined;

  return {
    title: siteName,
    description,
    icons: faviconUrl
      ? {
          icon: faviconUrl,
          shortcut: faviconUrl,
          apple: faviconUrl,
        }
      : undefined,
    openGraph: {
      title: siteName,
      description,
    },
    twitter: {
      card: "summary",
      title: siteName,
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
