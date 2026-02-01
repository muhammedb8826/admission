import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getStrapiURL } from "@/lib/strapi/client";
import { StudentApplicationForm } from "@/features/student-applications";

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

type StudentApplication = {
  id?: number;
  documentId?: string;
  applicationStatus?: string;
  submittedAt?: string | null;
  createdAt?: string | null;
  program_offering?: {
    id?: number;
    documentId?: string;
    program?: { name?: string; fullName?: string } | null;
    batch?: { name?: string; code?: string | null } | null;
    academic_calendar?: { name?: string; academicYearRange?: string } | null;
  } | null;
  academic_calendar?: {
    id?: number;
    name?: string;
    academicYearRange?: string;
  } | null;
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
    // DEBUG: raw Strapi response (application page)
    console.log("[Application getStudentProfile] raw result.data type:", Array.isArray(result?.data) ? "array" : typeof result?.data);
    if (result?.data && !Array.isArray(result.data)) {
      const single = result.data as Record<string, unknown>;
      console.log("[Application getStudentProfile] single profile keys:", Object.keys(single));
      console.log("[Application getStudentProfile] isProfileComplete:", single.isProfileComplete);
    } else if (result?.data && Array.isArray(result.data)) {
      console.log("[Application getStudentProfile] profiles count:", result.data.length);
      (result.data as Record<string, unknown>[]).forEach((p, i) => {
        console.log("[Application getStudentProfile] profile[" + i + "] isProfileComplete:", p.isProfileComplete, "keys:", Object.keys(p));
      });
    }

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
        const resolved = (userProfile || null) as StudentProfile | null;
        console.log("[Application getStudentProfile] resolved (from array) isProfileComplete:", resolved?.isProfileComplete);
        return resolved;
      } else if (result.data) {
        // Single object - check if it belongs to the user
        const profile = result.data as ProfileData;
        if (
          profile.email === email ||
          profile.user?.email === email ||
          profile.userId === userId ||
          profile.user?.id === Number(userId)
        ) {
          console.log("[Application getStudentProfile] resolved (single) isProfileComplete:", profile.isProfileComplete);
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
  const studentApplication = await getStudentApplication(studentProfile, session.userId);
  const hasApplication = !!studentApplication;
  console.log("[Application page] studentProfile id:", studentProfile?.id, "isProfileComplete raw:", studentProfile?.isProfileComplete, "resolved:", isProfileComplete);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      {/* Page header */}
      <header className="border-b bg-background px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">
          Student Application
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasApplication
            ? "Review your submitted application details."
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
        <section className="flex-1">
          {studentApplication ? (
            <div className="rounded-md border bg-background p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">
                Application Submitted
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your application has been recorded. Details are shown below.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">
                    {studentApplication.applicationStatus || "Draft"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted At</p>
                  <p className="text-sm font-medium">
                    {studentApplication.submittedAt
                      ? new Date(studentApplication.submittedAt).toLocaleString()
                      : studentApplication.createdAt
                        ? new Date(studentApplication.createdAt).toLocaleString()
                        : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Program</p>
                  <p className="text-sm font-medium">
                    {studentApplication.program_offering?.program?.name ||
                      studentApplication.program_offering?.program?.fullName ||
                      "Program"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Batch</p>
                  <p className="text-sm font-medium">
                    {studentApplication.program_offering?.batch?.code ||
                      studentApplication.program_offering?.batch?.name ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Academic Calendar</p>
                  <p className="text-sm font-medium">
                    {studentApplication.academic_calendar?.academicYearRange ||
                      studentApplication.academic_calendar?.name ||
                      studentApplication.program_offering?.academic_calendar?.academicYearRange ||
                      studentApplication.program_offering?.academic_calendar?.name ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Application ID</p>
                  <p className="text-sm font-medium">
                    {studentApplication.documentId || studentApplication.id || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <StudentApplicationForm />
          )}
        </section>
      </div>
    </div>
  );
}

async function getStudentApplication(profile: StudentProfile | null, sessionUserId: string) {
  try {
    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return null;
    }

    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    // Match program-offerings populate so program_offering returns program + batch (same shape as /api/program-offerings)
    const populate =
      "populate=*" +
      "&populate[academic_calendar]=*" +
      "&populate[program_offering][populate][academic_calendar][populate]=*" +
      "&populate[program_offering][populate][program][populate]=*" +
      "&populate[program_offering][populate][batch][populate]=*" +
      "&populate[program_offering][populate][college][populate]=*" +
      "&populate[program_offering][populate][department][populate]=*" +
      "&populate[program_offering][populate][semesters][populate]=*";

    const fetchByFilters = async (filters: string[]) => {
      const url = `${strapiUrl}/api/student-applications?${filters.join("&")}&${populate}&sort[0]=updatedAt:desc&pagination[pageSize]=1`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.log("[dashboard/application] student-applications not ok", {
          status: response.status,
          statusText: response.statusText,
          filters,
          errorBody,
        });
        return null;
      }

      const result = await response.json().catch(() => ({}));
      const data = result?.data;
      console.log("[dashboard/application] student-applications ok", {
        filters,
        total: result?.meta?.pagination?.total,
        firstId: Array.isArray(data) ? data?.[0]?.id : data?.id,
      });
      if (Array.isArray(data)) {
        return (data[0] as StudentApplication) || null;
      }
      return (data as StudentApplication) || null;
    };

    if (profile?.documentId) {
      const app = await fetchByFilters([
        `filters[student_profile][documentId][$eq]=${encodeURIComponent(profile.documentId)}`,
      ]);
      if (app) return app;
    }
    if (typeof profile?.id === "number") {
      const app = await fetchByFilters([`filters[student_profile][id][$eq]=${profile.id}`]);
      if (app) return app;
    }

    const userIdNumber = Number(sessionUserId);
    if (!Number.isFinite(userIdNumber)) return null;
    return await fetchByFilters([`filters[student_profile][user][id][$eq]=${userIdNumber}`]);
  } catch (error) {
    console.error("Error fetching student application:", error);
    return null;
  }
}

