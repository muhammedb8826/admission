import Link from "next/link";
import { RegistrationForm } from "@/features/registration";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign up with a username and email to get started.
        </p>
      </div>

      <RegistrationForm />

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
