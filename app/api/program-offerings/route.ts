import { NextRequest, NextResponse } from "next/server";
import { getStrapiURL } from "@/lib/strapi/client";

type StrapiEntity = Record<string, unknown>;

const normalizeEntity = (entity: unknown): StrapiEntity | null => {
  if (!entity || typeof entity !== "object") return null;
  const obj = entity as StrapiEntity;
  if ("attributes" in obj && obj.attributes && typeof obj.attributes === "object") {
    const attributes = obj.attributes as StrapiEntity;
    return {
      id: obj.id,
      documentId: obj.documentId ?? attributes.documentId,
      ...attributes,
    };
  }
  return obj;
};

const normalizeRelation = (relation: unknown): unknown => {
  if (!relation || typeof relation !== "object") return relation;
  const obj = relation as StrapiEntity;
  if ("data" in obj) {
    const data = obj.data;
    if (Array.isArray(data)) {
      return data.map((item) => normalizeEntity(item)).filter(Boolean);
    }
    return normalizeEntity(data);
  }
  if (Array.isArray(relation)) {
    return relation.map((item) => normalizeEntity(item)).filter(Boolean);
  }
  return normalizeEntity(relation);
};

const getField = (entity: unknown, key: string): unknown => {
  if (!entity || typeof entity !== "object") return undefined;
  const obj = entity as StrapiEntity;
  if ("attributes" in obj && obj.attributes && typeof obj.attributes === "object") {
    return (obj.attributes as StrapiEntity)[key];
  }
  return obj[key];
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const getCollectionLength = (value: unknown): number | null => {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const extractUsedCapacity = (item: StrapiEntity): number => {
  const candidates = [
    getField(item, "applications"),
    getField(item, "student_applications"),
    getField(item, "studentApplications"),
    getField(item, "applicants"),
    getField(item, "applicationsCount"),
    getField(item, "applicationCount"),
    getField(item, "currentApplications"),
    getField(item, "currentApplicants"),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeRelation(candidate);
    const count = getCollectionLength(normalized);
    if (typeof count === "number") return count;
  }

  return 0;
};

const fetchUsedCapacity = async ({
  strapiUrl,
  apiToken,
  offeringId,
  offeringDocumentId,
}: {
  strapiUrl: string;
  apiToken?: string;
  offeringId?: number | null;
  offeringDocumentId?: string | null;
}): Promise<number> => {
  const filters: string[] = [];
  if (offeringDocumentId) {
    filters.push(
      `filters[program_offering][documentId][$eq]=${encodeURIComponent(offeringDocumentId)}`
    );
  } else if (typeof offeringId === "number") {
    filters.push(`filters[program_offering][id][$eq]=${offeringId}`);
  } else {
    return 0;
  }

  const url = `${strapiUrl}/api/student-applications?${filters.join("&")}&pagination[pageSize]=1`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
      },
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      meta?: { pagination?: { total?: number } };
    };
    if (!res.ok) return 0;
    return json?.meta?.pagination?.total ?? 0;
  } catch {
    return 0;
  }
};

const normalizeOffering = (raw: StrapiEntity): StrapiEntity => {
  const base = normalizeEntity(raw) ?? raw;
  return {
    ...base,
    academic_calendar: normalizeRelation(getField(base, "academic_calendar")),
    program: normalizeRelation(getField(base, "program")),
    batch: normalizeRelation(getField(base, "batch")),
    college: normalizeRelation(getField(base, "college")),
    department: normalizeRelation(getField(base, "department")),
    semesters: normalizeRelation(getField(base, "semesters")),
  };
};

export async function GET(request: NextRequest) {
  try {
    // Public route: no auth required (used by apply/undergraduate, apply/postgraduate, etc.)
    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return NextResponse.json(
        { error: "Strapi API is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const populate = searchParams.get("populate") || "*";

    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    const filters = [
      "filters[isOpenForApply][$eq]=true",
      "filters[academic_calendar][isActive][$eq]=true",
      "pagination[pageSize]=100",
    ];
    const level = searchParams.get("level");
    if (level && level.trim()) {
      const normalizedLevel = level.trim().toLowerCase();
      const levelCandidates =
        normalizedLevel === "undergraduate"
          ? ["Undergraduate"]
          : normalizedLevel === "postgraduate" || normalizedLevel === "post graduate"
            ? ["Postgraduate", "Post Graduate"]
            : normalizedLevel === "phd"
              ? ["PhD", "PHD", "Phd"]
              : normalizedLevel === "pgdt"
                ? ["PGDT"]
                : normalizedLevel === "remedial"
                  ? ["Remedial"]
                  : [level.trim()];

      if (levelCandidates.length === 1) {
        filters.push(
          `filters[program][level][$eq]=${encodeURIComponent(levelCandidates[0])}`
        );
      } else {
        levelCandidates.forEach((candidate, index) => {
          filters.push(
            `filters[program][level][$in][${index}]=${encodeURIComponent(candidate)}`
          );
        });
      }
    }

    const url = `${strapiUrl}/api/program-offerings?populate=${encodeURIComponent(
      populate
    )}&${filters.join("&")}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
      },
      cache: "no-store",
    });

    const result = (await response.json().catch(() => ({}))) as {
      data?: unknown;
      meta?: unknown;
    };

    if (!response.ok) {
      const errorMessage =
        (result as { error?: { message?: unknown } })?.error?.message ||
        (result as { message?: unknown })?.message ||
        "Failed to fetch program offerings";

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

    const rawItems = Array.isArray(result?.data)
      ? (result.data as StrapiEntity[])
      : result?.data
        ? ([result.data] as StrapiEntity[])
        : [];

    const normalizedItems = await Promise.all(
      rawItems.map(async (item) => {
        const normalized = normalizeOffering(item);
        const capacity = toNumberOrNull(getField(normalized, "capacity"));
        const offeringId = toNumberOrNull(getField(normalized, "id"));
        const offeringDocumentId =
          typeof getField(normalized, "documentId") === "string"
            ? (getField(normalized, "documentId") as string)
            : null;
        const usedFromRelation = extractUsedCapacity(normalized);
        const usedCapacity =
          usedFromRelation > 0
            ? usedFromRelation
            : await fetchUsedCapacity({
                strapiUrl,
                apiToken,
                offeringId,
                offeringDocumentId,
              });
        const capacityRemaining =
          typeof capacity === "number" ? Math.max(capacity - usedCapacity, 0) : null;
        return {
          ...normalized,
          capacityUsed: usedCapacity,
          capacityRemaining,
        };
      })
    );

    const eligibleItems = normalizedItems.filter((item) => {
      const isOpen = Boolean(getField(item, "isOpenForApply"));
      const calendar = normalizeRelation(getField(item, "academic_calendar"));
      const calendarActive = Boolean(getField(calendar as StrapiEntity, "isActive"));
      const capacity = toNumberOrNull(getField(item, "capacity"));
      const usedCapacity = toNumberOrNull(getField(item, "capacityUsed")) ?? 0;
      const hasCapacity = capacity == null || usedCapacity < capacity;
      return isOpen && calendarActive && hasCapacity;
    });

    return NextResponse.json(
      {
        data: eligibleItems,
        meta: {
          ...(result?.meta as Record<string, unknown>),
          pagination: {
            ...(result?.meta as { pagination?: Record<string, unknown> })?.pagination,
            total: eligibleItems.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Program offerings fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch program offerings";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
