import Image from "next/image";
import { getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";

type StrapiIcon = {
  width?: number;
  height?: number;
  iconData?: string;
  iconName?: string;
};

type StrapiContactCard = {
  id: number;
  title: string;
  description: string;
  icon?: StrapiIcon | null;
};

type StrapiImage = {
  id: number;
  url: string;
  formats?: Record<string, { url: string }>;
  alternativeText?: string | null;
};

type StrapiContactResponse = {
  data?: {
    title?: string;
    heading?: string;
    subHeading?: string;
    cards?: StrapiContactCard[];
    image?: StrapiImage | null;
  } | null;
};

async function fetchContact(): Promise<StrapiContactResponse> {
  const base = getStrapiURL();
  if (!base) return {};
  try {
    const res = await fetch(`${base}/api/contact?populate=*`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

function IconMarkup({ icon }: { icon?: StrapiIcon | null }) {
  if (!icon?.iconData) return null;
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
      dangerouslySetInnerHTML={{
        __html: `<svg width="${icon.width || 24}" height="${icon.height || 24}" viewBox="0 0 24 24" fill="currentColor">${icon.iconData}</svg>`,
      }}
    />
  );
}

export default async function ContactPage() {
  const contactData = await fetchContact();
  const cards = contactData.data?.cards ?? [];
  const heading = contactData.data?.heading || contactData.data?.title || "Contact Us";
  const subHeading = contactData.data?.subHeading;
  const image = contactData.data?.image;
  const baseUrl = getStrapiURL();

  const imageUrl = image && baseUrl ? resolveImageUrl(image, baseUrl) : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-12 space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {contactData.data?.title || "Contact"}
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">{heading}</h1>
        {subHeading && (
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground leading-relaxed">
            {subHeading}
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Contact Cards */}
        <div className="space-y-6">
          {cards.length === 0 ? (
            <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
              Contact information coming soon.
            </div>
          ) : (
            cards.map((card) => (
              <div
                key={card.id}
                className="group flex gap-4 rounded-xl border bg-card p-6 shadow-sm transition hover:shadow-md"
              >
                <IconMarkup icon={card.icon} />
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact Image */}
        {imageUrl && (
          <div className="relative overflow-hidden rounded-xl border bg-muted/20">
            <Image
              src={imageUrl}
              alt={image?.alternativeText || "Contact us"}
              width={800}
              height={600}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        )}
      </div>
    </main>
  );
}

