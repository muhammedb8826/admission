import { ProgramsList, getPrograms } from "@/features/programs";

export default async function PhDPage() {
  const programs = await getPrograms();

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="mb-10 space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            PhD Programs
          </h1>
        </div>

        <ProgramsList programs={programs} initialFilter="phd" showFilters={false} />
      </main>
    </div>
  );
}

