import Link from "next/link";
import type { ProgramOffering } from "../types/program-offerings.types";

type ProgramOfferingsListProps = {
  offerings: ProgramOffering[];
};

const getOfferingLabel = (offering: ProgramOffering) => {
  const programName = offering.program?.name || offering.program?.fullName || "Program";
  const batchLabel = offering.batch?.code || offering.batch?.name || "";
  const calendarLabel =
    offering.academic_calendar?.academicYearRange || offering.academic_calendar?.name || "";
  const capacityRemaining =
    typeof offering.capacityRemaining === "number" ? offering.capacityRemaining : null;
  const parts = [programName, batchLabel, calendarLabel].filter(Boolean);
  const label = parts.join(" - ");
  return capacityRemaining === null ? label : `${label} (${capacityRemaining} seats left)`;
};

export function ProgramOfferingsList({ offerings }: ProgramOfferingsListProps) {
  if (!Array.isArray(offerings) || offerings.length === 0) {
    return (
      <div className="rounded-md border bg-background p-6 text-center text-sm text-muted-foreground">
        No program offerings are currently open for application.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {offerings.map((offering) => (
        <div key={offering.documentId ?? offering.id} className="rounded-md border bg-background p-5">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-foreground">
              {offering.program?.fullName || offering.program?.name || "Program"}
            </h3>
            <p className="text-sm text-muted-foreground">{getOfferingLabel(offering)}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {offering.program?.level && (
                <span className="rounded-full border px-2 py-0.5">
                  {offering.program.level}
                </span>
              )}
              {offering.program?.mode && (
                <span className="rounded-full border px-2 py-0.5">{offering.program.mode}</span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center rounded-md bg-(--brand-accent) px-3 py-1.5 text-xs font-semibold text-[#0c0d0f] transition hover:bg-(--brand-accent)/90"
            >
              Apply now
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
