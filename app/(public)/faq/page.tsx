import { getStrapiURL } from "@/lib/strapi/client";

type StrapiFaqItem = {
  id: number;
  title: string;
  description?: Array<{
    type?: string;
    children?: Array<{ text?: string }>;
  }>;
};

type StrapiFaqResponse = {
  data?: {
    title?: string;
    heading?: string;
    faqs?: StrapiFaqItem[];
  } | null;
};

async function fetchFaq(): Promise<StrapiFaqResponse> {
  const base = getStrapiURL();
  if (!base) return {};
  try {
    const res = await fetch(`${base}/api/faq?populate=*`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

function renderDescription(description?: StrapiFaqItem["description"]) {
  if (!description?.length) return null;
  return description.map((block, idx) => {
    const text = block.children?.map((c) => c.text).join(" ").trim();
    if (!text) return null;
    return (
      <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
        {text}
      </p>
    );
  });
}

export default async function FaqPage() {
  const faqData = await fetchFaq();
  const faqs = faqData.data?.faqs ?? [];
  const heading =
    faqData.data?.heading ||
    faqData.data?.title ||
    "Frequently Asked Questions";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-10 space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          FAQs
        </p>
        <h1 className="text-3xl font-semibold text-foreground">{heading}</h1>
      </div>

      <div className="space-y-4">
        {faqs.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No FAQs available right now.
          </div>
        ) : (
          faqs.map((faq) => (
            <details
              key={faq.id}
              className="group overflow-hidden rounded-xl border bg-card transition"
            >
              <summary className="flex cursor-pointer items-start justify-between gap-3 px-5 py-4 text-left font-semibold text-foreground hover:bg-muted/60">
                <span>{faq.title}</span>
                <span className="text-primary transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="space-y-3 px-5 pb-5">{renderDescription(faq.description)}</div>
            </details>
          ))
        )}
      </div>
    </main>
  );
}

