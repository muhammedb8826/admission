import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth";
import { ResetPasswordTokenForm } from "@/features/auth/components/ResetPasswordTokenForm";

async function ResetPasswordPageContent({ 
  searchParams 
}: { 
  searchParams: Promise<{ code?: string }> 
}) {
  // Check if there's a code in query params (Strapi's default email format)
  const params = await searchParams;
  const hasCode = params?.code;

  if (hasCode) {
    // If code is present, show the reset password form
    return (
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Reset Your Password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new password below.
          </p>
        </div>
        <ResetPasswordTokenForm />
      </div>
    );
  }

  // Otherwise, show the request reset form
  return (
    <div className="w-full max-w-md px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading...
          </p>
        </div>
        <div className="space-y-6 rounded-xl border bg-card/60 p-6 shadow-sm">
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    }>
      <ResetPasswordPageContent searchParams={searchParams} />
    </Suspense>
  );
}

