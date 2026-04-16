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

const getField = (entity: unknown, key: string): unknown => {
  if (!entity || typeof entity !== "object") return undefined;
  return (entity as StrapiEntity)[key];
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

/**
 * Record a payment for an existing student application (e.g. retry after a partial submit).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.data) {
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
    const authToken = apiToken || userJwt;

    const data = body.data as {
      studentApplicationId?: unknown;
      studentApplicationDocumentId?: unknown;
      paymentMethodId?: unknown;
      paymentMethodNumericId?: unknown;
      transactionId?: unknown;
      receiptId?: unknown;
      paymentStatus?: unknown;
    };

    const appDoc =
      typeof data.studentApplicationDocumentId === "string" &&
      data.studentApplicationDocumentId.trim() !== ""
        ? data.studentApplicationDocumentId.trim()
        : null;
    const appNum =
      toNumberOrNull(data.studentApplicationId) ??
      toNumberOrNull(data.studentApplicationDocumentId);
    if (!appDoc && appNum == null) {
      return NextResponse.json({ error: "Student application is required" }, { status: 400 });
    }

    const tx =
      typeof data.transactionId === "string" ? data.transactionId.trim() : "";
    if (!tx) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 });
    }

    const receiptId = toNumberOrNull(data.receiptId);
    if (receiptId == null) {
      return NextResponse.json({ error: "Receipt file id is required" }, { status: 400 });
    }

    const pmRaw = data.paymentMethodId;
    const pmNumeric = toNumberOrNull(data.paymentMethodNumericId);
    const pmDoc =
      typeof pmRaw === "string" && pmRaw.trim() !== "" && Number.isNaN(Number(pmRaw))
        ? pmRaw.trim()
        : null;
    const pmId = toNumberOrNull(pmRaw);
    if (!pmDoc && pmId == null && pmNumeric == null) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
    }

    const userIdNumber = getUserIdNumber(session);
    if (!userIdNumber) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
    }

    const appFilter =
      appDoc != null
        ? `filters[documentId][$eq]=${encodeURIComponent(appDoc)}`
        : `filters[id][$eq]=${appNum}`;
    const appListUrl = `${strapiUrl}/api/student-applications?${appFilter}&populate[student_profile][populate][user][fields][0]=id&pagination[pageSize]=1`;

    const appRes = await fetch(appListUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      cache: "no-store",
    });
    const appJson = (await appRes.json().catch(() => ({}))) as {
      data?: StrapiEntity | StrapiEntity[];
    };
    const rawData = appJson?.data;
    const appRow = Array.isArray(rawData) ? rawData[0] : rawData;
    if (!appRes.ok || !appRow || typeof appRow !== "object") {
      return NextResponse.json({ error: "Student application not found" }, { status: 404 });
    }

    const profileRaw = getField(appRow, "student_profile");
    const profile =
      profileRaw && typeof profileRaw === "object" && "data" in (profileRaw as object)
        ? (getField(profileRaw as StrapiEntity, "data") as StrapiEntity)
        : (profileRaw as StrapiEntity);
    const userRaw = profile && typeof profile === "object" ? getField(profile, "user") : undefined;
    const user =
      userRaw && typeof userRaw === "object" && "data" in (userRaw as object)
        ? (getField(userRaw as StrapiEntity, "data") as StrapiEntity)
        : (userRaw as StrapiEntity);
    const profileUserId = toNumberOrNull(user?.id ?? getField(user, "id"));
    if (profileUserId !== userIdNumber) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingCount = await countPaymentsForStudentApplication({
      strapiUrl,
      token: authToken,
      applicationDocumentId: (getField(appRow, "documentId") as string) || appDoc,
      applicationNumericId: toNumberOrNull(getField(appRow, "id")) ?? appNum,
    });
    if (existingCount > 0) {
      return NextResponse.json(
        { error: "A payment is already recorded for this application." },
        { status: 409 }
      );
    }

    const verifiedMethod = await fetchPaymentMethodByIdentifiers({
      strapiUrl,
      token: authToken,
      methodId: pmId ?? pmNumeric,
      methodDocumentId: pmDoc,
    });
    if (!verifiedMethod || !verifiedMethod.isActive) {
      return NextResponse.json({ error: "Invalid or inactive payment method." }, { status: 400 });
    }
    const methodType = String(verifiedMethod.type || "").toUpperCase();
    if (methodType !== "BANK" && methodType !== "TELEBIRR") {
      return NextResponse.json({ error: "Unsupported payment method type." }, { status: 400 });
    }

    const requestedStatus = parsePaymentStatus(data.paymentStatus);
    const paymentStatusForCreate: PaymentStatus =
      requestedStatus === "PENDING" || requestedStatus === "SUBMITTED"
        ? requestedStatus
        : "SUBMITTED";

    const payOutcome = await createPaymentRecord({
      strapiUrl,
      token: authToken,
      applicationDocumentId: (getField(appRow, "documentId") as string) || appDoc,
      applicationNumericId: toNumberOrNull(getField(appRow, "id")) ?? appNum,
      paymentMethodDocumentId:
        typeof verifiedMethod.documentId === "string" ? verifiedMethod.documentId : null,
      paymentMethodNumericId: typeof verifiedMethod.id === "number" ? verifiedMethod.id : null,
      transactionId: tx,
      receiptId,
      paymentStatus: paymentStatusForCreate,
    });

    if (!payOutcome.ok) {
      const msg =
        (payOutcome.body as { error?: { message?: unknown } })?.error?.message ||
        (payOutcome.body as { message?: unknown })?.message ||
        "Failed to create payment";
      return NextResponse.json({ error: String(msg), details: payOutcome.body }, { status: payOutcome.status });
    }

    return NextResponse.json(payOutcome.body, { status: 201 });
  } catch (error) {
    console.error("Payment creation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create payment";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
