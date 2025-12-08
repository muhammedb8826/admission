import Image from "next/image";
import type { AlumniDetail } from "../types/alumni.types";

type AlumniDetailViewProps = {
  alumni: AlumniDetail;
};

export function AlumniDetailView({ alumni }: AlumniDetailViewProps) {
  return (
    <article className="w-full py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4 space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-primary/10 text-primary md:h-40 md:w-40">
            {alumni.profileImageUrl ? (
              <Image
                src={alumni.profileImageUrl}
                alt={alumni.fullName}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 160px, 128px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-semibold md:text-4xl">
                {alumni.fullName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((name) => name[0])
                  .join("")
                  .toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {alumni.fullName}
            </h1>
            {(alumni.jobTitle || alumni.companyName) && (
              <p className="text-lg text-muted-foreground">
                {[alumni.jobTitle, alumni.companyName].filter(Boolean).join(" · ")}
              </p>
            )}
            {alumni.location && (
              <p className="text-base text-muted-foreground/80">{alumni.location}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Contact Information</h2>
            <dl className="space-y-3 text-sm">
              {alumni.email && (
                <div>
                  <dt className="font-medium text-muted-foreground">Email</dt>
                  <dd className="mt-0.5">
                    <a
                      href={`mailto:${alumni.email}`}
                      className="text-foreground hover:text-primary hover:underline"
                    >
                      {alumni.email}
                    </a>
                  </dd>
                </div>
              )}
              {alumni.phoneNumber && (
                <div>
                  <dt className="font-medium text-muted-foreground">Phone</dt>
                  <dd className="mt-0.5">
                    <a
                      href={`tel:${alumni.phoneNumber}`}
                      className="text-foreground hover:text-primary hover:underline"
                    >
                      {alumni.phoneNumber}
                    </a>
                  </dd>
                </div>
              )}
              {alumni.birthDate && (
                <div>
                  <dt className="font-medium text-muted-foreground">Birth Date</dt>
                  <dd className="mt-0.5 text-foreground">
                    {new Date(alumni.birthDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Professional Information</h2>
            <dl className="space-y-3 text-sm">
              {alumni.jobTitle && (
                <div>
                  <dt className="font-medium text-muted-foreground">Job Title</dt>
                  <dd className="mt-0.5 text-foreground">{alumni.jobTitle}</dd>
                </div>
              )}
              {alumni.companyName && (
                <div>
                  <dt className="font-medium text-muted-foreground">Company</dt>
                  <dd className="mt-0.5 text-foreground">{alumni.companyName}</dd>
                </div>
              )}
              {alumni.location && (
                <div>
                  <dt className="font-medium text-muted-foreground">Location</dt>
                  <dd className="mt-0.5 text-foreground">{alumni.location}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </article>
  );
}

