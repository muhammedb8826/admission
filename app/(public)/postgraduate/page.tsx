import { ProgramsList, getPrograms } from "@/features/programs";

export default async function PostGraduatePage() {
  const programs = await getPrograms();

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="mb-10 space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Graduate Programs
          </h1>
        </div>

        <ProgramsList programs={programs} initialFilter="postgraduate" showFilters={false} />
      </main>
    </div>
  );
}

