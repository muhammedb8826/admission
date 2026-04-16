import { NextRequest, NextResponse } from "next/server";
import { getStrapiURL } from "@/lib/strapi/client";
import { getSession } from "@/lib/auth/session";
import {
  countPaymentsForStudentApplication,
  createPaymentRecord,
  fetchPaymentMethodByIdentifiers,
  parsePaymentStatus,
  type PaymentStatus,
} from "@/lib/strapi/payments";

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

const extractApplicationFromStrapiResponse = (result: unknown): StrapiEntity | null => {
  const raw = result as { data?: unknown };
  const data = raw?.data;
  if (Array.isArray(data)) {
    const first = data[0];
    return normalizeEntity(first) ?? (first as StrapiEntity);
  }
  if (data && typeof data === "object") {
    return normalizeEntity(data) ?? (data as StrapiEntity);
  }
  return null;
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
    "populate[program][fields][0]=documentId",
    "populate[program][fields][1]=id",
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

/** Strapi v4/v5 may use snake_case or camelCase relation keys in filters */
const STUDENT_PROFILE_FILTER_KEYS = ["student_profile", "studentProfile"] as const;
const PROGRAM_OFFERING_FILTER_KEYS = ["program_offering", "programOffering"] as const;

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
  for (const rel of PROGRAM_OFFERING_FILTER_KEYS) {
    const filters: string[] = [];
    if (offeringDocumentId) {
      filters.push(`filters[${rel}][documentId][$eq]=${encodeURIComponent(offeringDocumentId)}`);
    } else if (typeof offeringId === "number") {
      filters.push(`filters[${rel}][id][$eq]=${offeringId}`);
    } else {
      continue;
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
    if (!res.ok) continue;
    return raw?.meta?.pagination?.total ?? 0;
  }
  return 0;
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
  const offeringFilterVariants: string[][] = [];
  for (const rel of PROGRAM_OFFERING_FILTER_KEYS) {
    if (offeringDocumentId) {
      offeringFilterVariants.push([
        `filters[${rel}][documentId][$eq]=${encodeURIComponent(offeringDocumentId)}`,
      ]);
    } else if (typeof offeringId === "number") {
      offeringFilterVariants.push([`filters[${rel}][id][$eq]=${offeringId}`]);
    }
  }
  if (offeringFilterVariants.length === 0) {
    return null;
  }

  for (const profRel of STUDENT_PROFILE_FILTER_KEYS) {
    const profileFilters: string[] = [];
    if (profileDocumentId) {
      profileFilters.push(
        `filters[${profRel}][documentId][$eq]=${encodeURIComponent(profileDocumentId)}`
      );
    } else if (typeof profileId === "number") {
      profileFilters.push(`filters[${profRel}][id][$eq]=${profileId}`);
    } else {
      continue;
    }

    for (const offFilters of offeringFilterVariants) {
      const filters = [...profileFilters, ...offFilters];
      const url = `${strapiUrl}/api/student-applications?${filters.join("&")}&pagination[pageSize]=1`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const items = parseStrapiCollection(raw);
      if (items.length > 0) {
        const existing = normalizeEntity(items[0]) ?? items[0];
        return existing || null;
      }
    }
  }

  const targetOffering = {
    id: typeof offeringId === "number" ? offeringId : null,
    documentId: offeringDocumentId ?? null,
  };

  for (const profRel of STUDENT_PROFILE_FILTER_KEYS) {
    const profileFilters: string[] = [];
    if (profileDocumentId) {
      profileFilters.push(
        `filters[${profRel}][documentId][$eq]=${encodeURIComponent(profileDocumentId)}`
      );
    } else if (typeof profileId === "number") {
      profileFilters.push(`filters[${profRel}][id][$eq]=${profileId}`);
    } else {
      continue;
    }

    const fallbackUrl = `${strapiUrl}/api/student-applications?${profileFilters.join("&")}&populate[program_offering][fields][0]=id&populate[program_offering][fields][1]=documentId&pagination[pageSize]=100`;
    const fbRes = await fetch(fallbackUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      cache: "no-store",
    });
    if (!fbRes.ok) continue;
    const fbRaw = (await fbRes.json().catch(() => ({}))) as Record<string, unknown>;
    const fbItems = parseStrapiCollection(fbRaw);
    for (const app of fbItems) {
      const rawOff =
        getField(app, "program_offering") ?? getField(app, "programOffering");
      if (offeringIdentitiesMatch(getOfferingIdentity(rawOff), targetOffering)) {
        return normalizeEntity(app) ?? app;
      }
    }
  }

  return null;
};

/**
 * When combined profile+offering filters return nothing (Strapi filter quirks), find this user's
 * row by querying all applications for the offering and matching `student_profile` in memory.
 */
const findExistingApplicationByOfferingScan = async ({
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
  const hasProfileKey =
    (typeof profileDocumentId === "string" && profileDocumentId.trim() !== "") ||
    typeof profileId === "number";
  if (!hasProfileKey) {
    return null;
  }

  for (const rel of PROGRAM_OFFERING_FILTER_KEYS) {
    const filters: string[] = [];
    if (offeringDocumentId) {
      filters.push(`filters[${rel}][documentId][$eq]=${encodeURIComponent(offeringDocumentId)}`);
    } else if (typeof offeringId === "number") {
      filters.push(`filters[${rel}][id][$eq]=${offeringId}`);
    } else {
      continue;
    }

    const url = `${strapiUrl}/api/student-applications?${filters.join("&")}&populate=*&pagination[pageSize]=100`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      cache: "no-store",
    });
    if (!res.ok) continue;

    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const items = parseStrapiCollection(raw);
    for (const app of items) {
      const norm = normalizeEntity(app) ?? app;
      const spRaw =
        getField(norm, "student_profile") ?? getField(norm, "studentProfile");
      const spNorm = normalizeRelation(spRaw);
      const spUnwrapped = (Array.isArray(spNorm) ? spNorm[0] : spNorm) as StrapiEntity | null;
      const sp = (normalizeEntity(spUnwrapped) ?? spUnwrapped) as StrapiEntity | null;
      if (!sp || typeof sp !== "object") continue;

      const appDoc =
        typeof getField(sp, "documentId") === "string"
          ? (getField(sp, "documentId") as string)
          : null;
      const appPid = toNumberOrNull(getField(sp, "id"));

      const matchesProfile =
        (typeof profileDocumentId === "string" &&
          profileDocumentId.trim() !== "" &&
          appDoc != null &&
          appDoc === profileDocumentId.trim()) ||
        (typeof profileId === "number" && appPid === profileId);

      if (matchesProfile) {
        return norm as StrapiEntity;
      }
    }
  }

  return null;
};

const fetchApplicationsForProfile = async ({
  strapiUrl,
  profileId,
  profileDocumentId,
  token,
}: {
  strapiUrl: string;
  profileId?: number | null;
  profileDocumentId?: string | null;
  token?: string;
}): Promise<StrapiEntity[]> => {
  const populate =
    "populate[program_offering][fields][0]=id&populate[program_offering][fields][1]=documentId" +
    "&populate[program_offering][populate][program][fields][0]=id&populate[program_offering][populate][program][fields][1]=documentId";

  for (const profRel of STUDENT_PROFILE_FILTER_KEYS) {
    const filters: string[] = [];
    if (profileDocumentId) {
      filters.push(
        `filters[${profRel}][documentId][$eq]=${encodeURIComponent(profileDocumentId)}`
      );
    } else if (typeof profileId === "number") {
      filters.push(`filters[${profRel}][id][$eq]=${profileId}`);
    } else {
      return [];
    }
    const url = `${strapiUrl}/api/student-applications?${filters.join("&")}&${populate}&pagination[pageSize]=100`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      cache: "no-store",
    });
    if (!res.ok) continue;
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const items = parseStrapiCollection(raw);
    if (items.length > 0) {
      return items
        .map((item) => normalizeEntity(item) ?? item)
        .filter((item): item is StrapiEntity => Boolean(item));
    }
  }

  return [];
};

const getOfferingIdentity = (
  offering: unknown
): { id: number | null; documentId: string | null } => {
  if (typeof offering === "number" && Number.isFinite(offering)) {
    return { id: offering, documentId: null };
  }
  if (typeof offering === "string" && offering.trim() !== "" && !Number.isNaN(Number(offering))) {
    const n = Number(offering);
    return Number.isFinite(n) ? { id: n, documentId: null } : { id: null, documentId: null };
  }
  const normalized = normalizeRelation(offering) as StrapiEntity | StrapiEntity[] | null;
  const o = (Array.isArray(normalized) ? normalized[0] : normalized) as StrapiEntity | null;
  if (!o || typeof o !== "object") {
    return { id: null, documentId: null };
  }
  return {
    id: toNumberOrNull(getField(o, "id")),
    documentId:
      typeof getField(o, "documentId") === "string"
        ? (getField(o, "documentId") as string)
        : null,
  };
};

const getProgramIdentityFromOffering = (
  offering: unknown
): { id: number | null; documentId: string | null } => {
  const normalized = normalizeRelation(offering) as StrapiEntity | StrapiEntity[] | null;
  const o = (Array.isArray(normalized) ? normalized[0] : normalized) as StrapiEntity | null;
  if (!o || typeof o !== "object") {
    return { id: null, documentId: null };
  }
  const programRaw = normalizeRelation(getField(o, "program"));
  const program = (Array.isArray(programRaw) ? programRaw[0] : programRaw) as StrapiEntity | null;
  if (!program || typeof program !== "object") {
    return { id: null, documentId: null };
  }
  return {
    id: toNumberOrNull(getField(program, "id")),
    documentId:
      typeof getField(program, "documentId") === "string"
        ? (getField(program, "documentId") as string)
        : null,
  };
};

const offeringIdentitiesMatch = (
  a: { id: number | null; documentId: string | null },
  b: { id: number | null; documentId: string | null }
): boolean => {
  if (a.documentId && b.documentId && a.documentId === b.documentId) return true;
  if (a.id != null && b.id != null && a.id === b.id) return true;
  return false;
};

const programIdentitiesMatch = (
  a: { id: number | null; documentId: string | null },
  b: { id: number | null; documentId: string | null }
): boolean => {
  if (a.documentId && b.documentId && a.documentId === b.documentId) return true;
  if (a.id != null && b.id != null && a.id === b.id) return true;
  return false;
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
    // Prefer the server API token when available.
    const authToken = apiToken || userJwt;

    const bodyData = body.data as {
      programOfferingId?: unknown;
      programOfferingNumericId?: unknown;
    };
    const programOfferingIdRaw = bodyData?.programOfferingId;
    const programOfferingId = toNumberOrNull(programOfferingIdRaw);
    const programOfferingDocumentId =
      typeof programOfferingIdRaw === "string" &&
      programOfferingIdRaw.trim() !== "" &&
      Number.isNaN(Number(programOfferingIdRaw))
        ? programOfferingIdRaw.trim()
        : null;
    const programOfferingNumericId = toNumberOrNull(bodyData?.programOfferingNumericId);
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

    let programOffering = await fetchProgramOffering({
      strapiUrl,
      offeringId: programOfferingId,
      offeringDocumentId: programOfferingDocumentId,
      token: authToken,
    });
    if (!programOffering && programOfferingNumericId != null) {
      programOffering = await fetchProgramOffering({
        strapiUrl,
        offeringId: programOfferingNumericId,
        offeringDocumentId: null,
        token: authToken,
      });
    }
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

    const applicationStatus =
      typeof (body.data as { applicationStatus?: unknown })?.applicationStatus === "string"
        ? (body.data as { applicationStatus: string }).applicationStatus
        : "Draft";
    const isSubmitted = applicationStatus.trim().toLowerCase() === "submitted";
    const applicationFee = toNumberOrNull(getField(programOffering, "applicationFee"));
    const requiresApplicationPayment =
      isSubmitted && applicationFee != null && applicationFee > 0;

    type PaymentPayload = {
      paymentMethodId?: unknown;
      paymentMethodNumericId?: unknown;
      transactionId?: unknown;
      receiptId?: unknown;
      /** PENDING or SUBMITTED only (applicant); defaults to SUBMITTED */
      paymentStatus?: unknown;
    };
    const paymentPayload = (body.data as { payment?: PaymentPayload }).payment;

    let resolvedPaymentMethodDocumentId: string | null = null;
    let resolvedPaymentMethodNumericId: number | null = null;
    let resolvedPaymentTransactionId: string | null = null;
    let resolvedPaymentReceiptId: number | null = null;
    let resolvedPaymentStatus: PaymentStatus = "SUBMITTED";

    if (requiresApplicationPayment) {
      if (!paymentPayload) {
        return NextResponse.json(
          {
            error:
              "Payment details are required because this program has an application fee.",
          },
          { status: 400 }
        );
      }
      const tx =
        typeof paymentPayload.transactionId === "string"
          ? paymentPayload.transactionId.trim()
          : "";
      if (!tx) {
        return NextResponse.json(
          { error: "Transaction reference is required for the application fee." },
          { status: 400 }
        );
      }
      const receiptNumeric = toNumberOrNull(paymentPayload.receiptId);
      if (receiptNumeric == null) {
        return NextResponse.json(
          { error: "A payment receipt file is required for the application fee." },
          { status: 400 }
        );
      }
      const pmRaw = paymentPayload.paymentMethodId;
      const pmNumericFromBody = toNumberOrNull(paymentPayload.paymentMethodNumericId);
      const pmDocumentId =
        typeof pmRaw === "string" && pmRaw.trim() !== "" && Number.isNaN(Number(pmRaw))
          ? pmRaw.trim()
          : null;
      const pmIdFromRaw = toNumberOrNull(pmRaw);
      if (!pmDocumentId && pmIdFromRaw == null && pmNumericFromBody == null) {
        return NextResponse.json({ error: "Payment method is required." }, { status: 400 });
      }
      const verifiedMethod = await fetchPaymentMethodByIdentifiers({
        strapiUrl,
        token: authToken,
        methodId: pmIdFromRaw ?? pmNumericFromBody,
        methodDocumentId: pmDocumentId,
      });
      if (!verifiedMethod || !verifiedMethod.isActive) {
        return NextResponse.json({ error: "Invalid or inactive payment method." }, { status: 400 });
      }
      const methodType = String(verifiedMethod.type || "").toUpperCase();
      if (methodType !== "BANK" && methodType !== "TELEBIRR") {
        return NextResponse.json({ error: "Unsupported payment method type." }, { status: 400 });
      }
      resolvedPaymentMethodDocumentId =
        typeof verifiedMethod.documentId === "string" ? verifiedMethod.documentId : null;
      resolvedPaymentMethodNumericId =
        typeof verifiedMethod.id === "number" ? verifiedMethod.id : null;
      resolvedPaymentTransactionId = tx;
      resolvedPaymentReceiptId = receiptNumeric;
      const requested = parsePaymentStatus(paymentPayload.paymentStatus);
      if (requested === "PENDING" || requested === "SUBMITTED") {
        resolvedPaymentStatus = requested;
      }
    }

    const offeringDocumentId =
      (getField(programOffering, "documentId") as string | null) ||
      programOfferingDocumentId;
    const resolvedOfferingNumericId =
      toNumberOrNull(getField(programOffering, "id")) ??
      programOfferingNumericId ??
      programOfferingId;

    const currentCount = await fetchApplicationCount({
      strapiUrl,
      offeringId: resolvedOfferingNumericId,
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

    let existingApplication = await findExistingApplication({
      strapiUrl,
      profileId,
      profileDocumentId,
      offeringId: resolvedOfferingNumericId,
      offeringDocumentId,
      token: authToken,
    });

    if (!existingApplication) {
      existingApplication = await findExistingApplicationByOfferingScan({
        strapiUrl,
        profileId,
        profileDocumentId,
        offeringId: resolvedOfferingNumericId,
        offeringDocumentId,
        token: authToken,
      });
    }

    const targetOfferingIdentity = {
      id: resolvedOfferingNumericId,
      documentId: offeringDocumentId ?? null,
    };
    const targetProgramIdentity = getProgramIdentityFromOffering(programOffering);

    if (!existingApplication) {
      const profileApps = await fetchApplicationsForProfile({
        strapiUrl,
        profileId,
        profileDocumentId,
        token: authToken,
      });
      for (const app of profileApps) {
        const rawOff =
          getField(app, "program_offering") ?? getField(app, "programOffering");
        if (offeringIdentitiesMatch(getOfferingIdentity(rawOff), targetOfferingIdentity)) {
          existingApplication = normalizeEntity(app) ?? app;
          break;
        }
      }

      if (!existingApplication) {
        const hasProgramKey =
          targetProgramIdentity.documentId != null ||
          (targetProgramIdentity.id != null && targetProgramIdentity.id > 0);
        if (hasProgramKey) {
          for (const app of profileApps) {
            const rawOff =
              getField(app, "program_offering") ?? getField(app, "programOffering");
            if (offeringIdentitiesMatch(getOfferingIdentity(rawOff), targetOfferingIdentity)) {
              continue;
            }
            const appProgramIdentity = getProgramIdentityFromOffering(rawOff);
            if (programIdentitiesMatch(appProgramIdentity, targetProgramIdentity)) {
              return NextResponse.json(
                {
                  error:
                    "You already have an application for this program. Each program may only be applied to once.",
                },
                { status: 409 }
              );
            }
          }
        }
      }
    }

    const shouldSetSubmittedAt = applicationStatus.toLowerCase() !== "draft";

    const payload: Record<string, unknown> = {
      applicationStatus,
      ...(shouldSetSubmittedAt && { submittedAt: new Date().toISOString() }),
      student_profile: profileDocumentId || profileId,
      program_offering: offeringDocumentId || resolvedOfferingNumericId || programOfferingId,
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

    const httpStatus = existingApplication ? 200 : 201;
    const appEntity = extractApplicationFromStrapiResponse(result);

    if (
      requiresApplicationPayment &&
      appEntity &&
      resolvedPaymentTransactionId != null &&
      resolvedPaymentReceiptId != null
    ) {
      const appDocCreated = getField(appEntity, "documentId") as string | null;
      const appNumericCreated = toNumberOrNull(getField(appEntity, "id"));
      const existingPayCount = await countPaymentsForStudentApplication({
        strapiUrl,
        token: authToken,
        applicationDocumentId: appDocCreated,
        applicationNumericId: appNumericCreated,
      });
      if (existingPayCount === 0) {
        const payOutcome = await createPaymentRecord({
          strapiUrl,
          token: authToken,
          applicationDocumentId: appDocCreated,
          applicationNumericId: appNumericCreated,
          paymentMethodDocumentId: resolvedPaymentMethodDocumentId,
          paymentMethodNumericId: resolvedPaymentMethodNumericId,
          transactionId: resolvedPaymentTransactionId,
          receiptId: resolvedPaymentReceiptId,
          paymentStatus: resolvedPaymentStatus,
        });
        if (!payOutcome.ok) {
          const payErr =
            (payOutcome.body as { error?: { message?: unknown } })?.error?.message ||
            (payOutcome.body as { message?: unknown })?.message ||
            "Failed to record payment";
          return NextResponse.json(
            {
              ...(typeof result === "object" && result !== null && !Array.isArray(result)
                ? (result as Record<string, unknown>)
                : {}),
              paymentError: String(payErr),
              paymentDetails: payOutcome.body,
              applicationFeeNote:
                "Your application was saved, but the payment record could not be created. Contact admissions with your application ID.",
            },
            { status: httpStatus }
          );
        }
        return NextResponse.json(
          {
            ...(typeof result === "object" && result !== null && !Array.isArray(result)
              ? (result as Record<string, unknown>)
              : {}),
            payment: payOutcome.body,
          },
          { status: httpStatus }
        );
      }
    }

    return NextResponse.json(result, { status: httpStatus });
  } catch (error) {
    console.error("Student application creation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create student application";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
