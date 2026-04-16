type StrapiEntity = Record<string, unknown>;

/** Strapi enum for payment records */
export const PAYMENT_STATUSES = ["PENDING", "SUBMITTED", "VERIFIED", "REJECTED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function parsePaymentStatus(value: unknown): PaymentStatus | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const upper = value.trim().toUpperCase();
  return isPaymentStatus(upper) ? upper : null;
}

export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "SUBMITTED":
      return "Submitted";
    case "VERIFIED":
      return "Verified";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

export type PaymentMethodRecord = {
  id: number;
  documentId?: string;
  type: string;
  name?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  telebirrName?: string | null;
  telebirrNumber?: string | null;
  isActive?: boolean;
};

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

const parseStrapiCollection = (raw: unknown): StrapiEntity[] => {
  const obj = raw as { data?: unknown };
  const data = obj?.data;
  if (Array.isArray(data)) return data as StrapiEntity[];
  if (data && typeof data === "object") return [data as StrapiEntity];
  return [];
};

export async function fetchActivePaymentMethods(
  strapiUrl: string,
  token?: string
): Promise<PaymentMethodRecord[]> {
  const url = `${strapiUrl}/api/payment-methods?filters[isActive][$eq]=true&pagination[pageSize]=50&sort[0]=type:asc`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const items = parseStrapiCollection(raw);
  return items
    .map((item) => normalizeEntity(item) ?? item)
    .filter(Boolean) as PaymentMethodRecord[];
}

export async function fetchPaymentMethodByIdentifiers({
  strapiUrl,
  token,
  methodId,
  methodDocumentId,
}: {
  strapiUrl: string;
  token?: string;
  methodId?: number | null;
  methodDocumentId?: string | null;
}): Promise<PaymentMethodRecord | null> {
  const filters: string[] = [];
  if (methodDocumentId) {
    filters.push(`filters[documentId][$eq]=${encodeURIComponent(methodDocumentId)}`);
  } else if (typeof methodId === "number") {
    filters.push(`filters[id][$eq]=${methodId}`);
  } else {
    return null;
  }
  const url = `${strapiUrl}/api/payment-methods?${filters.join("&")}&pagination[pageSize]=1`;
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
  const row = normalizeEntity(items[0]) ?? items[0];
  return (row as PaymentMethodRecord) || null;
}

export async function countPaymentsForStudentApplication({
  strapiUrl,
  token,
  applicationDocumentId,
  applicationNumericId,
}: {
  strapiUrl: string;
  token?: string;
  applicationDocumentId?: string | null;
  applicationNumericId?: number | null;
}): Promise<number> {
  const filters: string[] = [];
  if (applicationDocumentId) {
    filters.push(
      `filters[studentApplication][documentId][$eq]=${encodeURIComponent(applicationDocumentId)}`
    );
  } else if (typeof applicationNumericId === "number") {
    filters.push(`filters[studentApplication][id][$eq]=${applicationNumericId}`);
  } else {
    return 0;
  }
  const url = `${strapiUrl}/api/payments?${filters.join("&")}&pagination[pageSize]=1`;
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
}

export async function createPaymentRecord({
  strapiUrl,
  token,
  applicationDocumentId,
  applicationNumericId,
  paymentMethodDocumentId,
  paymentMethodNumericId,
  transactionId,
  receiptId,
  paymentStatus,
}: {
  strapiUrl: string;
  token?: string;
  applicationDocumentId?: string | null;
  applicationNumericId?: number | null;
  paymentMethodDocumentId?: string | null;
  paymentMethodNumericId?: number | null;
  transactionId: string;
  receiptId: number;
  /** Defaults to SUBMITTED when the applicant submits proof with the application */
  paymentStatus?: PaymentStatus | string;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  const status: PaymentStatus = parsePaymentStatus(paymentStatus) ?? "SUBMITTED";
  const data: Record<string, unknown> = {
    transactionId: transactionId.trim(),
    paymentStatus: status,
    studentApplication: applicationDocumentId || applicationNumericId,
    paymentMethod: paymentMethodDocumentId || paymentMethodNumericId,
    receipt: receiptId,
  };

  const res = await fetch(`${strapiUrl}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ data }),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}
