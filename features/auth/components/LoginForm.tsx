"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; submit?: string }>({});
  const isRegistered = searchParams.get("registered") === "true";

  const validate = () => {
    const newErrors: { identifier?: string; password?: string; submit?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = "Username or email is required";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous submit error
    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: undefined }));
    }

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Login failed");
      }

      // Redirect to dashboard or the redirect URL if provided
      const redirectUrl = searchParams.get("redirect") || "/dashboard";
      router.push(redirectUrl);
      router.refresh(); // Refresh to update server-side auth state
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        ...errors,
        submit: error instanceof Error ? error.message : "Login failed. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-card/60 p-6 shadow-sm">
      {/* Success message */}
      {isRegistered && (
        <div className="rounded-md border border-emerald-500/50 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          <p className="font-medium">Registration Successful!</p>
          <p className="mt-1">Your account has been created. Please login to continue.</p>
        </div>
      )}
      {/* Inline error message */}
      {errors.submit && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">Error</p>
          <p className="mt-1">{errors.submit}</p>
        </div>
      )}
        <div className="space-y-1">
          <label htmlFor="identifier" className="block text-sm font-medium">
            Username or Email <span className="text-destructive">*</span>
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="username or you@example.com"
            autoComplete="username"
          />
          {errors.identifier && (
            <p className="mt-1 text-xs text-destructive">{errors.identifier}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Password <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password}</p>
          )}
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Use the same password you used during registration.
            </p>
            <Link
              href="/reset-password"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors ml-2"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={
      <div className="space-y-6 rounded-xl border bg-card/60 p-6 shadow-sm">
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}


