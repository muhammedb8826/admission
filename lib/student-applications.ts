import { getStrapiURL } from "@/lib/strapi/client";
import {
  parsePaymentStatus,
  paymentStatusLabel,
  type PaymentStatus,
} from "@/lib/strapi/payments";

export type PaymentMethodSummary = {
  type?: string;
  name?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  telebirrName?: string | null;
  telebirrNumber?: string | null;
};

export type PaymentReceiptSummary = {
  name?: string | null;
  url?: string | null;
};

export type StudentApplicationPayment = {
  id?: number;
  documentId?: string;
  paymentStatus?: string;
  transactionId?: string | null;
  paymentMethod?: PaymentMethodSummary | null;
  receipt?: PaymentReceiptSummary | null;
};

/** Shallow fields from populated `student_profile` for list/detail UI */
export type StudentApplicationProfileSummary = {
  firstNameEn?: string;
  firstNameAm?: string;
  fatherNameEn?: string;
  fatherNameAm?: string;
  grandFatherNameEn?: string;
  grandFatherNameAm?: string;
};

export type StudentApplicationRecord = {
  id?: number;
  documentId?: string;
  applicationStatus?: string;
  submittedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  student_profile?: StudentApplicationProfileSummary | null;
  payments?: StudentApplicationPayment[];
  /** Strapi may return a one-to-one relation as `payment` instead of `payments` */
  payment?: unknown;
  program_offering?: {
    id?: number;
    documentId?: string;
    applicationFee?: number | null;
    isOpenForApply?: boolean;
    capacity?: number | null;
    program?: {
      id?: number;
      documentId?: string;
      name?: string;
      fullName?: string;
      level?: string;
      mode?: string;
      qualification?: string;
    } | null;
    batch?: { name?: string; code?: string | null; intakeYear?: number } | null;
    college?: { name?: string; code?: string | null } | null;
    department?: { name?: string; code?: string | null } | null;
    academic_calendar?: { name?: string; academicYearRange?: string } | null;
    semesters?: { name?: string; semesterNumber?: number; yearNumber?: number }[] | null;
  } | null;
  academic_calendar?: {
    id?: number;
    name?: string;
    academicYearRange?: string;
  } | null;
};

type StudentProfileRef = {
  id?: number;
  documentId?: string;
} | null;

type StrapiRow = Record<string, unknown>;

/** Strapi v4/v5: flatten `{ id, attributes }` into a single object */
function normalizeStrapiEntity(entity: unknown): StrapiRow | null {
  if (!entity || typeof entity !== "object") return null;
  const obj = entity as StrapiRow;
  if ("attributes" in obj && obj.attributes && typeof obj.attributes === "object") {
    const attributes = obj.attributes as StrapiRow;
    return {
      ...attributes,
      id: (obj.id ?? attributes.id) as number | undefined,
      documentId: (obj.documentId ?? attributes.documentId) as string | undefined,
    };
  }
  return obj as StrapiRow;
}

/** Unwrap `{ data: T | T[] }` and normalize the first entry */
function normalizeStrapiRelationOne(raw: unknown): StrapiRow | null {
  if (raw == null) return null;
  let cur: unknown = raw;
  if (typeof cur === "object" && cur !== null && "data" in cur) {
    const d = (cur as { data: unknown }).data;
    cur = Array.isArray(d) ? d[0] : d;
  }
  return normalizeStrapiEntity(cur);
}

function parseStrapiDataArray(result: unknown): unknown[] {
  const data = (result as { data?: unknown })?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function getStudentProfileRefFromApplicationRow(row: StrapiRow): StudentProfileRef {
  const sp = row.student_profile ?? row.studentProfile;
  if (!sp || typeof sp !== "object") return null;
  const flat = normalizeStrapiRelationOne(sp) ?? normalizeStrapiEntity(sp);
  if (!flat) return null;
  const documentId =
    typeof flat.documentId === "string" && flat.documentId.trim() !== ""
      ? flat.documentId.trim()
      : undefined;
  const id = toFiniteNumber(flat.id);
  if (!documentId && id == null) return null;
  return { id, documentId };
}

function profileRefsMatch(a: StudentProfileRef, b: StudentProfileRef): boolean {
  if (!a || !b) return false;
  if (
    typeof a.documentId === "string" &&
    typeof b.documentId === "string" &&
    a.documentId.trim() !== "" &&
    a.documentId === b.documentId.trim()
  ) {
    return true;
  }
  const aid = toFiniteNumber(a.id);
  const bid = toFiniteNumber(b.id);
  return aid != null && bid != null && aid === bid;
}

const STUDENT_PROFILE_FILTER_KEYS = ["student_profile", "studentProfile"] as const;

/**
 * Deep populate for dashboard lists (matches Strapi query the team uses in the API browser).
 */
const APPLICATION_POPULATE =
  "populate[student_profile][populate]=*" +
  "&populate[program_offering][populate]=*" +
  "&populate[academic_calendar][populate]=*" +
  "&populate[payments][populate]=*";

/**
 * When Strapi relation filters return nothing, fetch with the same deep `populate` as list
 * queries, then keep only rows whose embedded `student_profile` matches the logged-in profile.
 */
async function fetchApplicationsPopulateStarFilterByProfile(
  strapiUrl: string,
  authToken: string | undefined,
  profileRef: Exclude<StudentProfileRef, null>
): Promise<StudentApplicationRecord[]> {
  const url = `${strapiUrl}/api/student-applications?${APPLICATION_POPULATE}&sort[0]=updatedAt:desc&pagination[pageSize]=100`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    return [];
  }
  const result = (await response.json().catch(() => ({}))) as unknown;
  const rawRows = parseStrapiDataArray(result);
  const out: StudentApplicationRecord[] = [];
  for (const raw of rawRows) {
    const row = normalizeStrapiEntity(raw) ?? (raw as StrapiRow);
    const appProfile = getStudentProfileRefFromApplicationRow(row);
    if (!appProfile || !profileRefsMatch(profileRef, appProfile)) continue;
    out.push(normalizeApplicationRow(raw));
  }
  return out;
}

function sortApplicationsNewestFirst(apps: StudentApplicationRecord[]): StudentApplicationRecord[] {
  return [...apps].sort((a, b) => {
    const ta = Date.parse(String(a.updatedAt ?? a.createdAt ?? 0));
    const tb = Date.parse(String(b.updatedAt ?? b.createdAt ?? 0));
    return Number.isFinite(ta) && Number.isFinite(tb) ? tb - ta : 0;
  });
}

/** Same resolution strategy as POST /api/student-applications: profile by `user.id`. */
async function fetchStudentProfileRefByUserId(
  strapiUrl: string,
  authToken: string | undefined,
  sessionUserId: string
): Promise<StudentProfileRef> {
  const userIdNumber = Number(sessionUserId);
  if (!Number.isFinite(userIdNumber) || userIdNumber <= 0) {
    return null;
  }
  const url =
    `${strapiUrl}/api/student-profiles?filters[user][id][$eq]=${userIdNumber}` +
    "&pagination[pageSize]=1";
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json().catch(() => ({}))) as unknown;
  const first = parseStrapiDataArray(json)[0];
  const flat = normalizeStrapiEntity(first);
  if (!flat) return null;
  const id = toFiniteNumber(flat.id);
  const documentId =
    typeof flat.documentId === "string" && flat.documentId.trim() !== ""
      ? flat.documentId.trim()
      : undefined;
  if (!documentId && id == null) return null;
  return { id, documentId };
}

function flattenStrapiRelationMany<T>(rel: unknown): T[] {
  if (rel == null) return [];
  if (Array.isArray(rel)) return rel as T[];
  if (typeof rel === "object" && "data" in (rel as object)) {
    const d = (rel as { data: unknown }).data;
    if (Array.isArray(d)) return d as T[];
    if (d && typeof d === "object") return [d as T];
  }
  return [];
}

/** One-to-many `payments` or single `payment` / nested `data` shapes from Strapi */
function flattenStrapiPaymentsField(rel: unknown): StudentApplicationPayment[] {
  const many = flattenStrapiRelationMany<StudentApplicationPayment>(rel);
  if (many.length > 0) return many;
  if (rel && typeof rel === "object" && rel !== null && !Array.isArray(rel)) {
    const obj = rel as Record<string, unknown>;
    if ("data" in obj && obj.data) {
      return flattenStrapiRelationMany<StudentApplicationPayment>(obj.data);
    }
    if (typeof obj.paymentStatus === "string" || typeof obj.id === "number") {
      return [obj as StudentApplicationPayment];
    }
  }
  return [];
}

function normalizePaymentRow(p: unknown): StudentApplicationPayment {
  const flat = normalizeStrapiEntity(p) ?? (p as StrapiRow);
  const pm = normalizeStrapiRelationOne(
    flat.paymentMethod ?? flat.payment_method
  ) as PaymentMethodSummary | null;
  const rcFlat = normalizeStrapiRelationOne(flat.receipt);
  const receipt: PaymentReceiptSummary | null =
    rcFlat && typeof rcFlat === "object"
      ? {
          name: typeof rcFlat.name === "string" ? rcFlat.name : undefined,
          url: typeof rcFlat.url === "string" ? rcFlat.url : undefined,
        }
      : null;
  return {
    id: toFiniteNumber(flat.id),
    documentId: typeof flat.documentId === "string" ? flat.documentId : undefined,
    paymentStatus: typeof flat.paymentStatus === "string" ? flat.paymentStatus : undefined,
    transactionId:
      typeof flat.transactionId === "string"
        ? flat.transactionId
        : flat.transactionId === null
          ? null
          : null,
    paymentMethod: pm ?? undefined,
    receipt: receipt?.url || receipt?.name ? receipt : undefined,
  };
}

type ProgramOfferingSemester = NonNullable<
  NonNullable<StudentApplicationRecord["program_offering"]>["semesters"]
>[number];

function normalizeSemestersList(raw: unknown): ProgramOfferingSemester[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const out = raw
      .map((item) => normalizeStrapiEntity(item) ?? (item as StrapiRow))
      .filter(Boolean)
      .map((s) => ({
        name: typeof s.name === "string" ? s.name : undefined,
        semesterNumber: toFiniteNumber(s.semesterNumber),
        yearNumber: toFiniteNumber(s.yearNumber),
      })) as ProgramOfferingSemester[];
    return out.length > 0 ? out : null;
  }
  const one = normalizeStrapiRelationOne(raw);
  if (!one) return null;
  return [
    {
      name: typeof one.name === "string" ? one.name : undefined,
      semesterNumber: toFiniteNumber(one.semesterNumber),
      yearNumber: toFiniteNumber(one.yearNumber),
    },
  ];
}

function normalizeApplicationRow(rawInput: unknown): StudentApplicationRecord {
  const row = normalizeStrapiEntity(rawInput) ?? (rawInput as StrapiRow);
  const fromPayments = flattenStrapiPaymentsField(row.payments);
  const fromPayment = flattenStrapiPaymentsField(row.payment);
  const merged = (fromPayments.length > 0 ? fromPayments : fromPayment).map((p) =>
    normalizePaymentRow(p)
  );
  const offeringNorm = normalizeStrapiRelationOne(
    row.program_offering ?? row.programOffering
  );
  let program_offering: StudentApplicationRecord["program_offering"] | null = null;
  if (offeringNorm) {
    const programFlat = offeringNorm.program
      ? (normalizeStrapiRelationOne(offeringNorm.program) as StudentApplicationRecord["program_offering"] extends {
          program?: infer P;
        }
          ? P
          : never)
      : null;
    const collegeFlat = offeringNorm.college
      ? normalizeStrapiRelationOne(offeringNorm.college)
      : null;
    const deptFlat = offeringNorm.department
      ? normalizeStrapiRelationOne(offeringNorm.department)
      : null;
    const batchFlat = offeringNorm.batch
      ? normalizeStrapiRelationOne(offeringNorm.batch)
      : null;
    const offCal = offeringNorm.academic_calendar ?? offeringNorm.academicCalendar;
    const offCalFlat = offCal ? normalizeStrapiRelationOne(offCal) : null;
    const semesters = normalizeSemestersList(offeringNorm.semesters);
    program_offering = {
      ...(offeringNorm as Record<string, unknown>),
      id: toFiniteNumber(offeringNorm.id),
      documentId:
        typeof offeringNorm.documentId === "string" ? offeringNorm.documentId : undefined,
      applicationFee: toFiniteNumber(offeringNorm.applicationFee) ?? null,
      isOpenForApply: typeof offeringNorm.isOpenForApply === "boolean" ? offeringNorm.isOpenForApply : undefined,
      capacity: toFiniteNumber(offeringNorm.capacity) ?? null,
      program: programFlat ?? undefined,
      college: collegeFlat
        ? {
            name: typeof collegeFlat.name === "string" ? collegeFlat.name : undefined,
            code: typeof collegeFlat.code === "string" ? collegeFlat.code : null,
          }
        : null,
      department: deptFlat
        ? {
            name: typeof deptFlat.name === "string" ? deptFlat.name : undefined,
            code: typeof deptFlat.code === "string" || deptFlat.code === null ? (deptFlat.code as string | null) : null,
          }
        : null,
      batch: batchFlat
        ? {
            name: typeof batchFlat.name === "string" ? batchFlat.name : undefined,
            code: typeof batchFlat.code === "string" || batchFlat.code === null ? (batchFlat.code as string | null) : null,
            intakeYear: toFiniteNumber(batchFlat.intakeYear),
          }
        : null,
      academic_calendar: offCalFlat
        ? {
            name: typeof offCalFlat.name === "string" ? offCalFlat.name : undefined,
            academicYearRange:
              typeof offCalFlat.academicYearRange === "string"
                ? offCalFlat.academicYearRange
                : undefined,
          }
        : null,
      semesters,
    } as StudentApplicationRecord["program_offering"];
  }
  const academic_calendar = normalizeStrapiRelationOne(
    row.academic_calendar ?? row.academicCalendar
  ) as StudentApplicationRecord["academic_calendar"];
  const studentProfileNorm = normalizeStrapiRelationOne(
    row.student_profile ?? row.studentProfile
  );
  let student_profile: StudentApplicationProfileSummary | null = null;
  if (studentProfileNorm) {
    student_profile = {
      firstNameEn:
        typeof studentProfileNorm.firstNameEn === "string"
          ? studentProfileNorm.firstNameEn
          : undefined,
      firstNameAm:
        typeof studentProfileNorm.firstNameAm === "string"
          ? studentProfileNorm.firstNameAm
          : undefined,
      fatherNameEn:
        typeof studentProfileNorm.fatherNameEn === "string"
          ? studentProfileNorm.fatherNameEn
          : undefined,
      fatherNameAm:
        typeof studentProfileNorm.fatherNameAm === "string"
          ? studentProfileNorm.fatherNameAm
          : undefined,
      grandFatherNameEn:
        typeof studentProfileNorm.grandFatherNameEn === "string"
          ? studentProfileNorm.grandFatherNameEn
          : undefined,
      grandFatherNameAm:
        typeof studentProfileNorm.grandFatherNameAm === "string"
          ? studentProfileNorm.grandFatherNameAm
          : undefined,
    };
  }
  const base = row as unknown as StudentApplicationRecord;
  return {
    ...base,
    student_profile,
    program_offering: program_offering ?? null,
    academic_calendar: academic_calendar ?? base.academic_calendar ?? null,
    payments: merged,
  };
}

/**
 * All student applications for the logged-in user's profile (newest first).
 * @param sessionJwt Same as POST /api/student-applications: use the logged-in user's Strapi JWT when no server API token is configured.
 */
export async function getStudentApplications(
  profile: StudentProfileRef,
  sessionUserId: string,
  sessionJwt?: string | null
): Promise<StudentApplicationRecord[]> {
  try {
    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return [];
    }

    const authToken =
      process.env.NEXT_PUBLIC_API_TOKEN ||
      (typeof sessionJwt === "string" && sessionJwt.trim() !== "" ? sessionJwt.trim() : undefined);

    const fetchByFilters = async (filters: string[]): Promise<StudentApplicationRecord[]> => {
      const url = `${strapiUrl}/api/student-applications?${filters.join("&")}&${APPLICATION_POPULATE}&sort[0]=updatedAt:desc&pagination[pageSize]=100`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return [];
      }

      const result = (await response.json().catch(() => ({}))) as unknown;
      return parseStrapiDataArray(result).map((row) => normalizeApplicationRow(row));
    };

    const resolvedProfile =
      (await fetchStudentProfileRefByUserId(strapiUrl, authToken, sessionUserId)) ?? profile;

    const mergeByIdentity = (rows: StudentApplicationRecord[]): StudentApplicationRecord[] => {
      const seen = new Set<string>();
      const out: StudentApplicationRecord[] = [];
      for (const app of rows) {
        const idNum = toFiniteNumber(app.id);
        const key =
          typeof app.documentId === "string" && app.documentId.trim() !== ""
            ? `d:${app.documentId}`
            : idNum != null
              ? `i:${idNum}`
              : JSON.stringify(app);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(app);
      }
      return out;
    };

    const collected: StudentApplicationRecord[] = [];

    if (resolvedProfile?.documentId) {
      for (const profRel of STUDENT_PROFILE_FILTER_KEYS) {
        collected.push(
          ...(await fetchByFilters([
            `filters[${profRel}][documentId][$eq]=${encodeURIComponent(resolvedProfile.documentId)}`,
          ]))
        );
      }
    }
    const profileIdNum = toFiniteNumber(resolvedProfile?.id);
    if (profileIdNum != null) {
      for (const profRel of STUDENT_PROFILE_FILTER_KEYS) {
        collected.push(
          ...(await fetchByFilters([`filters[${profRel}][id][$eq]=${profileIdNum}`]))
        );
      }
    }

    let merged = mergeByIdentity(collected);
    if (merged.length > 0) {
      return sortApplicationsNewestFirst(merged);
    }

    const userIdNumber = Number(sessionUserId);
    if (Number.isFinite(userIdNumber)) {
      for (const profRel of STUDENT_PROFILE_FILTER_KEYS) {
        const apps = await fetchByFilters([
          `filters[${profRel}][user][id][$eq]=${userIdNumber}`,
        ]);
        if (apps.length > 0) return sortApplicationsNewestFirst(apps);
      }
    }

    if (resolvedProfile && (resolvedProfile.documentId || toFiniteNumber(resolvedProfile.id) != null)) {
      merged = await fetchApplicationsPopulateStarFilterByProfile(
        strapiUrl,
        authToken,
        resolvedProfile
      );
      if (merged.length > 0) {
        return sortApplicationsNewestFirst(mergeByIdentity(merged));
      }
    }

    return [];
  } catch (error) {
    console.error("Error fetching student applications:", error);
    return [];
  }
}

/** Keys passed to {@link StudentApplicationForm} to hide programs the student already applied to. */
export function getBlockedProgramKeysFromApplications(
  apps: StudentApplicationRecord[]
): string[] {
  const keys = new Set<string>();
  for (const app of apps) {
    const p = app.program_offering?.program;
    if (!p) continue;
    if (typeof p.documentId === "string" && p.documentId.trim() !== "") {
      keys.add(`doc:${p.documentId.trim()}`);
    }
    const pid = toFiniteNumber(p.id);
    if (pid != null) {
      keys.add(`id:${pid}`);
    }
  }
  return [...keys];
}

/**
 * Program offerings the student already has an application for (hide from apply dropdown).
 */
export function getBlockedOfferingKeysFromApplications(
  apps: StudentApplicationRecord[]
): string[] {
  const keys = new Set<string>();
  for (const app of apps) {
    const o = app.program_offering;
    if (!o) continue;
    if (typeof o.documentId === "string" && o.documentId.trim() !== "") {
      keys.add(`odoc:${o.documentId.trim()}`);
    }
    const oid = toFiniteNumber(o.id);
    if (oid != null) {
      keys.add(`oid:${oid}`);
    }
  }
  return [...keys];
}

export type ApplicationPaymentUiStatus = PaymentStatus | "NONE" | "NOT_REQUIRED";

export function getApplicationPaymentStatusLine(app: StudentApplicationRecord): {
  status: ApplicationPaymentUiStatus;
  label: string;
} {
  const feeRaw = app.program_offering?.applicationFee;
  const hasFee =
    typeof feeRaw === "number" && Number.isFinite(feeRaw) && feeRaw > 0;
  const payments = app.payments ?? [];
  const primary = payments[0];
  const parsed = primary?.paymentStatus
    ? parsePaymentStatus(primary.paymentStatus)
    : null;

  if (parsed) {
    return { status: parsed, label: paymentStatusLabel(parsed) };
  }
  if (hasFee) {
    return { status: "NONE", label: "Awaiting payment" };
  }
  return { status: "NOT_REQUIRED", label: "No fee" };
}

export function applicationPaymentBadgeClassName(
  status: ApplicationPaymentUiStatus
): string {
  switch (status) {
    case "VERIFIED":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "REJECTED":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    case "SUBMITTED":
      return "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/20";
    case "PENDING":
      return "bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-500/20";
    case "NONE":
      return "bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/20";
    case "NOT_REQUIRED":
    default:
      return "border-muted-foreground/30 text-muted-foreground";
  }
}
