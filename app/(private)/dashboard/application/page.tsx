import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getStrapiURL } from "@/lib/strapi/client";
import { StudentApplicationForm } from "@/features/student-applications";
import { Badge } from "@/components/ui/badge";
import {
  applicationPaymentBadgeClassName,
  getApplicationPaymentStatusLine,
  getBlockedOfferingKeysFromApplications,
  getBlockedProgramKeysFromApplications,
  getStudentApplications,
  type StudentApplicationPayment,
  type StudentApplicationRecord,
} from "@/lib/student-applications";

type StudentProfile = {
  id?: number;
  documentId?: string;
  email?: string;
  userId?: string;
  user?: {
    email?: string;
    id?: number;
  };
  isProfileComplete?: boolean;
};

async function getStudentProfile(email: string, userId: string) {
  try {
    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return null;
    }

    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    
    // Use same query as dashboard so isProfileComplete and other root fields are returned consistently
    const response = await fetch(
      `${strapiUrl}/api/student-profiles?populate=*`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();

    // Filter server-side to only return the logged-in user's profile
    type ProfileData = StudentProfile & { [key: string]: unknown };
    
    if (result?.data) {
      if (Array.isArray(result.data)) {
        // Find profile matching the logged-in user
        const userProfile = result.data.find((profile: ProfileData) => {
          if (profile.email === email) return true;
          if (profile.user?.email === email) return true;
          if (profile.userId === userId) return true;
          if (profile.user?.id === Number(userId)) return true;
          return false;
        });
        return (userProfile || null) as StudentProfile | null;
      } else if (result.data) {
        // Single object - check if it belongs to the user
        const profile = result.data as ProfileData;
        if (
          profile.email === email ||
          profile.user?.email === email ||
          profile.userId === userId ||
          profile.user?.id === Number(userId)
        ) {
          return profile as StudentProfile;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return null;
  }
}

export default async function ApplicationPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Check if profile is complete
  const studentProfile = await getStudentProfile(session.email, session.userId);
  const isProfileComplete = studentProfile?.isProfileComplete === true;
  const studentApplications = await getStudentApplications(
    studentProfile,
    session.userId,
    session.jwt
  );
  const blockedProgramKeys = getBlockedProgramKeysFromApplications(studentApplications);
  const blockedOfferingKeys = getBlockedOfferingKeysFromApplications(studentApplications);
  const hasApplication = studentApplications.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      {/* Page header */}
      <header className="border-b bg-background px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">
          Student Application
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasApplication
            ? "Use the form to apply or update an application. Your applications are listed below—you can only have one application per program offering (resubmitting updates the same record)."
            : "Complete your application form to apply for admission."}
        </p>
        {!isProfileComplete && !hasApplication && (
          <p className="mt-2 text-sm text-destructive">
            Your profile is not complete. Please complete your profile to ensure your application is valid.
          </p>
        )}
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
        <section className="flex-1 space-y-8">
          {isProfileComplete ? (
            <StudentApplicationForm
              blockedProgramKeys={blockedProgramKeys}
              blockedOfferingKeys={blockedOfferingKeys}
            />
          ) : (
            <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Complete your profile to submit applications.
            </div>
          )}

          <div id="your-applications" className="space-y-4 scroll-mt-24">
            <h2 className="text-lg font-semibold text-foreground">Your applications</h2>
            <p className="text-sm text-muted-foreground">
              Programs you have already applied to are removed from the dropdown above. You can
              still update an existing application by choosing another open offering for the same
              program where allowed, or contact admissions.
            </p>
            {studentApplications.length === 0 ? (
              <div className="rounded-md border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
                No applications are linked to your profile yet. If you expected to see some here,
                try refreshing the page. Otherwise submit the form above—your list will update after
                a successful application.
              </div>
            ) : (
              <ul className="space-y-4">
                {studentApplications.map((app) => (
                  <ApplicationSummaryCard
                    key={app.documentId ? String(app.documentId) : `id-${app.id ?? "unknown"}`}
                    app={app}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function formatEtb(amount: number): string {
  return new Intl.NumberFormat("en-ET", { maximumFractionDigits: 2 }).format(amount);
}

function formatPaymentMethodLabel(pm: StudentApplicationPayment["paymentMethod"]): string {
  if (!pm) return "—";
  const t = String(pm.type || "").toUpperCase();
  if (t === "BANK") {
    return [pm.name, pm.accountName].filter(Boolean).join(" — ") || "Bank transfer";
  }
  if (t === "TELEBIRR") {
    return [pm.telebirrName, pm.telebirrNumber].filter(Boolean).join(" — ") || "Telebirr";
  }
  return pm.name || t || "—";
}

function receiptAbsoluteUrl(relativeOrAbsolute: string): string {
  if (relativeOrAbsolute.startsWith("http://") || relativeOrAbsolute.startsWith("https://")) {
    return relativeOrAbsolute;
  }
  const base = getStrapiURL().replace(/\/$/, "");
  const path = relativeOrAbsolute.startsWith("/") ? relativeOrAbsolute : `/${relativeOrAbsolute}`;
  return `${base}${path}`;
}

function ApplicationSummaryCard({ app }: { app: StudentApplicationRecord }) {
  const paymentUi = getApplicationPaymentStatusLine(app);
  const primaryPayment = app.payments?.[0];
  const offering = app.program_offering;
  const program = offering?.program;
  const profile = app.student_profile;
  const applicantLine = [profile?.firstNameEn, profile?.fatherNameEn, profile?.grandFatherNameEn]
    .filter(Boolean)
    .join(" ");
  const programTitle = program?.name || program?.fullName || "Program";
  const programSubtitle = [program?.fullName && program?.name ? program.fullName : null, program?.level, program?.mode]
    .filter(Boolean)
    .join(" · ");
  const calendarLabel =
    app.academic_calendar?.academicYearRange ||
    app.academic_calendar?.name ||
    offering?.academic_calendar?.academicYearRange ||
    offering?.academic_calendar?.name ||
    "N/A";
  const fee = offering?.applicationFee;
  const hasFee = typeof fee === "number" && Number.isFinite(fee) && fee > 0;
  const semesters = offering?.semesters?.length
    ? offering.semesters
        .map((s) => s.name || `Year ${s.yearNumber ?? "?"} · Sem ${s.semesterNumber ?? "?"}`)
        .join(", ")
    : null;
  const receiptUrl = primaryPayment?.receipt?.url;

  return (
    <li className="rounded-md border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{programTitle}</h3>
          {programSubtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{programSubtitle}</p>
          ) : null}
        </div>
        <Badge variant="secondary" className="shrink-0">
          {app.applicationStatus || "Draft"}
        </Badge>
      </div>

      {applicantLine ? (
        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Applicant:</span> {applicantLine}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">College</p>
          <p className="text-sm font-medium">{offering?.college?.name || "—"}</p>
          {offering?.college?.code ? (
            <p className="text-xs text-muted-foreground">Code: {offering.college.code}</p>
          ) : null}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Department</p>
          <p className="text-sm font-medium">{offering?.department?.name || "—"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Batch</p>
          <p className="text-sm font-medium">
            {offering?.batch?.code || offering?.batch?.name || "—"}
          </p>
          {offering?.batch?.intakeYear != null ? (
            <p className="text-xs text-muted-foreground">Intake {offering.batch.intakeYear}</p>
          ) : null}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Academic calendar</p>
          <p className="text-sm font-medium">{calendarLabel}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Application fee</p>
          <p className="text-sm font-medium">{hasFee ? `${formatEtb(fee)} ETB` : "No fee"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Offering</p>
          <p className="text-xs font-mono text-muted-foreground break-all">
            {offering?.documentId || offering?.id || "—"}
          </p>
        </div>
        {semesters ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-muted-foreground">Semesters</p>
            <p className="text-sm font-medium">{semesters}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <h4 className="text-sm font-semibold text-foreground">Payment</h4>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Payment status</p>
            <Badge variant="outline" className={applicationPaymentBadgeClassName(paymentUi.status)}>
              {paymentUi.label}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Transaction reference</p>
            <p className="text-sm font-medium">{primaryPayment?.transactionId || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Method</p>
            <p className="text-sm font-medium">{formatPaymentMethodLabel(primaryPayment?.paymentMethod)}</p>
          </div>
          {receiptUrl ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-sm text-muted-foreground">Receipt</p>
              <a
                href={receiptAbsoluteUrl(receiptUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary underline underline-offset-2"
              >
                {primaryPayment?.receipt?.name || "View receipt"}
              </a>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Submitted</p>
          <p className="text-sm font-medium">
            {app.submittedAt
              ? new Date(app.submittedAt).toLocaleString()
              : app.createdAt
                ? new Date(app.createdAt).toLocaleString()
                : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Application ID</p>
          <p className="text-xs font-mono font-medium break-all">{app.documentId || app.id || "N/A"}</p>
        </div>
      </div>
    </li>
  );
}

