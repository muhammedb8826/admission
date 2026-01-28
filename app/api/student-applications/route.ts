import { NextRequest, NextResponse } from "next/server";
import { getStrapiURL } from "@/lib/strapi/client";
import { getSession } from "@/lib/auth/session";

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

const getUserIdNumber = (session: unknown): number | null => {
  const s = session as { userId?: unknown };
  const raw = typeof s?.userId === "string" ? s.userId : String(s?.userId ?? "");
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const parseStrapiCollection = (raw: unknown): StrapiEntity[] => {
  const obj = raw as { data?: unknown };
  const data = obj?.data;
  if (Array.isArray(data)) return data as StrapiEntity[];
  if (data && typeof data === "object") return [data as StrapiEntity];
  return [];
};

const fetchStudentProfileForUser = async ({
  strapiUrl,
  userJwt,
  apiToken,
  userIdNumber,
}: {
  strapiUrl: string;
  userJwt?: string;
  apiToken?: string;
  userIdNumber: number;
}): Promise<StrapiEntity | null> => {
  const baseQueryParts = [
    "populate[user][fields][0]=id",
    "populate[user][fields][1]=documentId",
    "sort[0]=updatedAt:desc",
    "sort[1]=createdAt:desc",
    "pagination[pageSize]=1",
  ];
  const baseQuery = baseQueryParts.join("&");
  const url = `${strapiUrl}/api/student-profiles?filters[user][id][$eq]=${userIdNumber}&${baseQuery}`;

  const tryFetch = async (token?: string) => {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      cache: "no-store",
    });
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, raw };
  };

  for (const token of [userJwt, apiToken]) {
    const res = await tryFetch(token);
    if (res.ok) {
      const items = parseStrapiCollection(res.raw);
      const profile = normalizeEntity(items[0]) ?? items[0];
      return profile || null;
    }
  }

  return null;
};

const fetchProgramOffering = async ({
  strapiUrl,
  offeringId,
  offeringDocumentId,
  token,
}: {
  strapiUrl: string;
  offeringId?: number | null;
  offeringDocumentId?: string | null;
  token?: string;
}): Promise<StrapiEntity | null> => {
  const populate = [
    "populate[academic_calendar][fields][0]=documentId",
    "populate[academic_calendar][fields][1]=isActive",
  ].join("&");

  const filters: string[] = [];
  if (offeringDocumentId) {
    filters.push(
      `filters[documentId][$eq]=${encodeURIComponent(offeringDocumentId)}`
    );
  } else if (typeof offeringId === "number") {
    filters.push(`filters[id][$eq]=${offeringId}`);
  } else {
    return null;
  }

  const url = `${strapiUrl}/api/program-offerings?${filters.join("&")}&${populate}&pagination[pageSize]=1`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    cache: "no-store",
  });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) return null;
  const items = parseStrapiCollection(raw);
  const normalized = normalizeEntity(items[0]) ?? items[0];
  return normalized || null;
};

const fetchApplicationCount = async ({
  strapiUrl,
  offeringId,
  offeringDocumentId,
  token,
}: {
  strapiUrl: string;
  offeringId?: number | null;
  offeringDocumentId?: string | null;
  token?: string;
}): Promise<number> => {
  const filters: string[] = [];
  if (offeringDocumentId) {
    filters.push(
      `filters[program_offering][documentId][$eq]=${encodeURIComponent(offeringDocumentId)}`
    );
  } else if (typeof offeringId === "number") {
    filters.push(`filters[program_offering][id][$eq]=${offeringId}`);
  }
  const url = `${strapiUrl}/api/student-applications?${filters.join("&")}&pagination[pageSize]=1`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    cache: "no-store",
  });
  const raw = (await res.json().catch(() => ({}))) as {
    meta?: { pagination?: { total?: number } };
  };
  if (!res.ok) return 0;
  return raw?.meta?.pagination?.total ?? 0;
};

const findExistingApplication = async ({
  strapiUrl,
  profileId,
  profileDocumentId,
  offeringId,
  offeringDocumentId,
  token,
}: {
  strapiUrl: string;
  profileId?: number | null;
  profileDocumentId?: string | null;
  offeringId?: number | null;
  offeringDocumentId?: string | null;
  token?: string;
}): Promise<StrapiEntity | null> => {
  const filters: string[] = [];
  if (profileDocumentId) {
    filters.push(
      `filters[student_profile][documentId][$eq]=${encodeURIComponent(profileDocumentId)}`
    );
  } else if (typeof profileId === "number") {
    filters.push(`filters[student_profile][id][$eq]=${profileId}`);
  }
  if (offeringDocumentId) {
    filters.push(
      `filters[program_offering][documentId][$eq]=${encodeURIComponent(offeringDocumentId)}`
    );
  } else if (typeof offeringId === "number") {
    filters.push(`filters[program_offering][id][$eq]=${offeringId}`);
  }

  const url = `${strapiUrl}/api/student-applications?${filters.join("&")}&pagination[pageSize]=1`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const items = parseStrapiCollection(raw);
  const existing = normalizeEntity(items[0]) ?? items[0];
  return existing || null;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return NextResponse.json(
        { error: "Strapi API is not configured" },
        { status: 500 }
      );
    }

    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    const { search } = new URL(request.url);
    const url = `${strapiUrl}/api/student-applications${search || ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
      },
      cache: "no-store",
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        (result as { error?: { message?: unknown } })?.error?.message ||
        (result as { message?: unknown })?.message ||
        "Failed to fetch student applications";
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Student applications fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch student applications";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.data) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return NextResponse.json(
        { error: "Strapi API is not configured" },
        { status: 500 }
      );
    }

    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    const userJwt = (session as { jwt?: string }).jwt;
    const authToken = userJwt || apiToken;

    const programOfferingIdRaw = (body.data as { programOfferingId?: unknown })
      ?.programOfferingId;
    const programOfferingId = toNumberOrNull(programOfferingIdRaw);
    const programOfferingDocumentId =
      typeof programOfferingIdRaw === "string" &&
      programOfferingIdRaw.trim() !== "" &&
      Number.isNaN(Number(programOfferingIdRaw))
        ? programOfferingIdRaw.trim()
        : null;
    if (!programOfferingId && !programOfferingDocumentId) {
      return NextResponse.json(
        { error: "Program offering is required" },
        { status: 400 }
      );
    }

    const userIdNumber = getUserIdNumber(session);
    if (!userIdNumber) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
    }

    const profile = await fetchStudentProfileForUser({
      strapiUrl,
      userJwt,
      apiToken,
      userIdNumber,
    });
    if (!profile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const programOffering = await fetchProgramOffering({
      strapiUrl,
      offeringId: programOfferingId,
      offeringDocumentId: programOfferingDocumentId,
      token: authToken,
    });
    if (!programOffering) {
      return NextResponse.json(
        { error: "Program offering not found" },
        { status: 404 }
      );
    }

    const isOpenForApply = Boolean(getField(programOffering, "isOpenForApply"));
    const capacity = toNumberOrNull(getField(programOffering, "capacity"));
    const academicCalendar = normalizeRelation(getField(programOffering, "academic_calendar"));
    const calendarActive = Boolean(
      getField(academicCalendar as StrapiEntity, "isActive")
    );

    if (!isOpenForApply || !calendarActive) {
      return NextResponse.json(
        { error: "Program offering is not open for application" },
        { status: 409 }
      );
    }

    const offeringDocumentId =
      (getField(programOffering, "documentId") as string | null) ||
      programOfferingDocumentId;
    const currentCount = await fetchApplicationCount({
      strapiUrl,
      offeringId: programOfferingId,
      offeringDocumentId,
      token: authToken,
    });

    if (capacity != null && currentCount >= capacity) {
      return NextResponse.json(
        { error: "Program offering capacity has been reached" },
        { status: 409 }
      );
    }

    const profileId = getField(profile, "id") as number | undefined;
    const profileDocumentId = getField(profile, "documentId") as string | null;
    const calendarId = getField(academicCalendar, "id") as number | undefined;
    const calendarDocumentId = getField(academicCalendar, "documentId") as string | null;

    const existingApplication = await findExistingApplication({
      strapiUrl,
      profileId,
      profileDocumentId,
      offeringId: programOfferingId,
      offeringDocumentId,
      token: authToken,
    });

    const applicationStatus =
      typeof (body.data as { applicationStatus?: unknown })?.applicationStatus === "string"
        ? (body.data as { applicationStatus: string }).applicationStatus
        : "Draft";
    const shouldSetSubmittedAt = applicationStatus.toLowerCase() !== "draft";

    const payload: Record<string, unknown> = {
      applicationStatus,
      ...(shouldSetSubmittedAt && { submittedAt: new Date().toISOString() }),
      student_profile: profileDocumentId || profileId,
      program_offering: offeringDocumentId || programOfferingId,
      academic_calendar: calendarDocumentId || calendarId,
    };

    const endpoint = existingApplication
      ? `${strapiUrl}/api/student-applications/${getField(existingApplication, "documentId") || getField(existingApplication, "id")}`
      : `${strapiUrl}/api/student-applications`;
    const method = existingApplication ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify({ data: payload }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage =
        (result as { error?: { message?: unknown } })?.error?.message ||
        (result as { message?: unknown })?.message ||
        "Failed to create student application";
      return NextResponse.json(
        { error: errorMessage, details: result },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(result, { status: existingApplication ? 200 : 201 });
  } catch (error) {
    console.error("Student application creation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create student application";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
