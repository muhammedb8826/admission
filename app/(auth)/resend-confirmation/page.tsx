import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

export default function ResendConfirmationAlias({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Preserve any query params (e.g., ?email=...) when redirecting
  const qs = new URLSearchParams();
  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, v));
    } else if (value !== undefined) {
      qs.set(key, value);
    }
  });

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/email-confirmation${suffix}`);
}

