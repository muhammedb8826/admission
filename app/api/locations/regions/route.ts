import { NextRequest, NextResponse } from "next/server";
import { getStrapiURL } from "@/lib/strapi/client";
import { getSession } from "@/lib/auth/session";

type StrapiEntity = {
  id?: number;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
};

const normalizeEntity = (entity: unknown): Record<string, unknown> | null => {
  if (!entity || typeof entity !== "object") return null;
  const obj = entity as StrapiEntity;
  if (obj.attributes && typeof obj.attributes === "object") {
    return {
      id: obj.id,
      ...(obj.attributes as Record<string, unknown>),
    };
  }
  return obj as Record<string, unknown>;
};

const normalizeCollectionResult = (raw: unknown) => {
  const result = raw as { data?: unknown; meta?: unknown };
  const data = result?.data;
  const items = Array.isArray(data)
    ? (data as unknown[]).map((item) => normalizeEntity(item)).filter(Boolean)
    : data
      ? [normalizeEntity(data)].filter(Boolean)
      : [];
  return {
    data: items,
    meta: result?.meta,
  };
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return NextResponse.json(
        { error: "Strapi API is not configured" },
        { status: 500 }
      );
    }

    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get("countryId");
    const populate = searchParams.get("populate") || "zones";

    let url = `${strapiUrl}/api/regions?populate=${populate}`;
    if (countryId) {
      url += `&filters[country][id][$eq]=${countryId}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        (result as { error?: { message?: unknown } })?.error?.message ||
        (result as { message?: unknown })?.message ||
        "Failed to fetch regions";
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

    const normalized = normalizeCollectionResult(result);
    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    console.error("Regions fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch regions";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

