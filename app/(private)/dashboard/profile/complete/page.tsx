import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { StudentProfileCompletionForm } from "@/components/student-profile-completion-form";

export default async function CompleteProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      {/* Page header */}
      <header className="border-b bg-background px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">
          Complete Your Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in your profile information to complete your student profile
        </p>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
        <section className="flex-1">
          <StudentProfileCompletionForm />
        </section>
      </div>
    </div>
  );
}
