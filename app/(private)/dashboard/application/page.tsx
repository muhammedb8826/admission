import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getStrapiURL } from "@/lib/strapi/client";
import { StudentApplicationForm } from "@/components/student-application-form";

async function getStudentProfile(email: string, userId: string) {
  try {
    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return null;
    }

    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    
    // Fetch profile with all nested data
    const response = await fetch(
      `${strapiUrl}/api/student-profiles?populate[residentialAddress][populate]=*&populate[birthAddress][populate]=*&populate[personToBeContacted][populate]=*&populate[primary_education][populate]=*&populate[secondary_education][populate]=*&populate[tertiary_educations][populate]=*`,
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
    type ProfileData = {
      email?: string;
      userId?: string;
      user?: {
        email?: string;
        id?: number;
      };
      [key: string]: unknown;
    };
    
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
        return userProfile || null;
      } else if (result.data) {
        // Single object - check if it belongs to the user
        const profile = result.data as ProfileData;
        if (
          profile.email === email ||
          profile.user?.email === email ||
          profile.userId === userId ||
          profile.user?.id === Number(userId)
        ) {
          return profile;
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

  // Redirect to profile completion if profile is not complete
  if (!isProfileComplete) {
    redirect("/dashboard/profile/complete");
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      {/* Page header */}
      <header className="border-b bg-background px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">
          Student Application
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your application form to apply for admission
        </p>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
        <section className="flex-1">
          <StudentApplicationForm />
        </section>
      </div>
    </div>
  );
}

