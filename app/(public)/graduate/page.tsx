import { ProgramsList, getPrograms } from "@/features/programs";

export default async function GraduatePage() {
  const programs = await getPrograms();

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="mb-10 space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Graduate Programs
          </p>
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Graduate Programs
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Explore our graduate programs designed to prepare you for success.
          </p>
        </div>

        <ProgramsList programs={programs} initialFilter="graduate" showFilters={false} />
      </main>
    </div>
  );
}

