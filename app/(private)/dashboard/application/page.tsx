
import { StudentApplicationForm } from "@/components/student-application-form";
  export default async function ApplicationPage() {
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

