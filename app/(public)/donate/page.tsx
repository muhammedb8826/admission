import { PageHeaderBanner } from "@/features/layout";
import Link from "next/link";

export default function DonatePage() {
  return (
    <div className="w-full">
      <PageHeaderBanner
        title="Donate"
        backgroundImageUrl="/images/hero-banner/banner.jpg"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Donate" },
        ]}
      />
      <section className="w-full py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m-8.25 3.75h16.5m-16.5 3.75h16.5m-16.5-7.5h16.5"
                />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Coming Soon
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              We&apos;re working on setting up our donation platform. Check back soon to support our alumni community and initiatives.
            </p>
            <div className="pt-8">
              <p className="text-sm text-muted-foreground">
                For inquiries, please contact us through our{" "}
                <Link href="/" className="text-primary hover:text-primary/80 underline" title="Homepage">
                  homepage
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

