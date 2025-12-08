import { Suspense } from "react";
import { EmailConfirmationForm } from "@/features/auth/components/EmailConfirmationForm";

function EmailConfirmationPageContent() {
  return (
    <div className="w-full max-w-md px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Confirm Your Email
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please confirm your email address to activate your account.
        </p>
      </div>

      <EmailConfirmationForm />
    </div>
  );
}

export default function EmailConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Confirm Your Email
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
          </div>
          <div className="space-y-6 rounded-xl border bg-card/60 p-6 shadow-sm">
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      }
    >
      <EmailConfirmationPageContent />
    </Suspense>
  );
}
