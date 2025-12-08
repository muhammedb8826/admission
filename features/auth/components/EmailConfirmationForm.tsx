"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function EmailConfirmationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmationCode = searchParams?.get("confirmation") || null;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [hasAutoConfirmed, setHasAutoConfirmed] = useState(false);

  // Auto-confirm if code is in URL
  useEffect(() => {
    const handleAutoConfirm = async () => {
    if (!confirmationCode) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/email-confirmation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ confirmation: confirmationCode }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || "Failed to confirm email");
        }

        setIsSuccess(true);
        setTimeout(() => {
          router.push("/login?confirmed=true");
        }, 2000);
      } catch (error) {
        console.error("Email confirmation error:", error);
        setError(error instanceof Error ? error.message : "Failed to confirm email. Please try again.");
        setIsSubmitting(false);
      }
    };

    if (confirmationCode && !hasAutoConfirmed && !isSuccess && !error) {
      setHasAutoConfirmed(true);
      handleAutoConfirm();
    }
  }, [confirmationCode, hasAutoConfirmed, isSuccess, error, router]);

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json().catch(() => {
        // If JSON parsing fails, it might be a network error
        console.error("Failed to parse response as JSON");
        return { error: "Network error. Please check your connection and try again." };
      });

      // Log for debugging
      console.log("Resend confirmation response:", { status: response.status, ok: response.ok, result });

      if (!response.ok) {
        // Check if there's a specific error message
        const errorMessage = result?.error || result?.message || "Failed to resend confirmation email. Please try again.";
        throw new Error(errorMessage);
      }

      // The API always returns success (to prevent email enumeration)
      // So if we get here, treat it as success
      if (result?.success === true || response.ok) {
        setIsSuccess(true);
        // Don't redirect immediately - let user see success message
        // They can manually navigate to login
      } else {
        // This shouldn't happen, but handle it just in case
        throw new Error(result?.error || result?.message || "Failed to resend confirmation email. Please try again.");
      }
    } catch (error) {
      console.error("Resend confirmation error:", error);
      setError(error instanceof Error ? error.message : "Failed to resend confirmation email. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-xl border bg-card/60 p-6 shadow-sm">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {confirmationCode ? "Email Confirmed Successfully!" : "Confirmation Email Sent!"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {confirmationCode 
                ? "Your email has been confirmed. Redirecting to login..."
                : "Please check your email for the confirmation link."}
            </p>
          </div>
          {!confirmationCode && (
            <Link
              href="/login"
              className="inline-block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Back to login
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Show resend confirmation form if no code in URL
  if (!confirmationCode) {
    return (
      <form onSubmit={handleResendConfirmation} className="space-y-6 rounded-xl border bg-card/60 p-6 shadow-sm">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            Email Address <span className="text-destructive">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Enter your email address to receive a new confirmation link.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Resend Confirmation Email"}
        </button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </form>
    );
  }

  // Show loading state while confirming
  return (
    <div className="rounded-xl border bg-card/60 p-6 shadow-sm">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-6 w-6 animate-spin text-primary"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Confirming your email...</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please wait while we confirm your email address.
          </p>
        </div>
      </div>
      {error && (
        <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">Error</p>
          <p className="mt-1">{error}</p>
          <div className="mt-3">
            <Link
              href="/resend-confirmation"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Resend confirmation email
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

