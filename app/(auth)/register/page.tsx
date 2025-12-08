import Link from "next/link";
import { RegistrationForm, getGenderOptions, getNationalityOptions, getAlumniCategoryOptions } from "@/features/registration";

export default async function RegisterPage() {
  const [genderOptions, nationalityOptions, alumniCategoryOptions] = await Promise.all([
    getGenderOptions(),
    getNationalityOptions(),
    getAlumniCategoryOptions(),
  ]);

  return (
    <div className="w-full max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Register as Alumni
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join our alumni community and reconnect with fellow graduates.
        </p>
      </div>

      <RegistrationForm
        genderOptions={genderOptions}
        nationalityOptions={nationalityOptions}
        alumniCategoryOptions={alumniCategoryOptions}
      />

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
