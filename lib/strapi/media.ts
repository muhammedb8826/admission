type StrapiFormat = {
  url: string;
};

type StrapiImage = {
  url: string;
  formats?: Record<string, StrapiFormat>;
};

const formatPreference = ["large", "medium", "small", "thumbnail"];

export function resolveImageUrl(
  image: StrapiImage | null | undefined,
  baseUrl: string
) {
  if (!image) return undefined;

  const candidate =
    image.formats &&
    formatPreference
      .map((key) => image.formats?.[key])
      .find((format): format is StrapiFormat => Boolean(format));

  const relativeUrl = candidate?.url ?? image.url;
  if (!relativeUrl) return undefined;

  // ensure no double slashes
  return `${baseUrl.replace(/\/$/, "")}${relativeUrl}`;
}

