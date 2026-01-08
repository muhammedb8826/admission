import { ProgramsList, getPrograms } from "@/features/programs";

type ProgramsPageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function ProgramsPage({ searchParams }: ProgramsPageProps) {
  const programs = await getPrograms();
  const params = await searchParams;
  const initialFilter =
    params.type === "undergraduate" || params.type === "postgraduate"
      ? params.type
      : "all";

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="mb-10 space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Programs
          </p>
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Academic Programs
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Explore our undergraduate and graduate programs designed to prepare you for success.
          </p>
        </div>

        <ProgramsList programs={programs} initialFilter={initialFilter} />
      </main>
    </div>
  );
}

