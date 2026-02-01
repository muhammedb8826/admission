import { ProgramOfferingsList, getProgramOfferings } from "@/features/program-offerings";

export default async function ApplyPgdtPage() {
  const offerings = await getProgramOfferings("PGDT");

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="mb-10 space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Apply - PGDT Programs
          </h1>
        </div>

        <ProgramOfferingsList offerings={offerings} />
      </main>
    </div>
  );
}
