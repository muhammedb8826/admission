"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { ProgramOffering } from "../types/student-application.types";

export function StudentApplicationForm() {
  const [programOfferings, setProgramOfferings] = useState<ProgramOffering[]>([]);
  // Store the Strapi documentId (preferred in Strapi v5) or fallback id as string
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchProgramOfferings = async () => {
      setIsLoadingPrograms(true);
      setSubmitError(null);
      try {
        const response = await fetch("/api/program-offerings?populate=*");
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          const errorMessage =
            result?.error?.message ||
            result?.error ||
            result?.message ||
            "Failed to load programs";
          throw new Error(errorMessage);
        }
        if (Array.isArray(result?.data)) {
          setProgramOfferings(result.data as ProgramOffering[]);
        } else {
          setProgramOfferings([]);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load programs";
        setSubmitError(errorMessage);
        setProgramOfferings([]);
      } finally {
        setIsLoadingPrograms(false);
      }
    };
    fetchProgramOfferings();
  }, []);

  const getProgramOfferingLabel = (offering: ProgramOffering) => {
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

  const handleSubmit = async () => {
    if (!selectedOfferingId) {
      setSubmitError("Please select a program offering.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/student-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            // Send the Strapi documentId string when available (preferred in Strapi v5)
            programOfferingId: selectedOfferingId,
            applicationStatus: "Submitted",
          },
        }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Failed to submit application" }));
        throw new Error(error.error || "Failed to submit application");
      }

      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 rounded-md border bg-background p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Student Application</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select your preferred program offering and submit your application.
        </p>
      </div>

      {submitError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">Error</p>
          <p className="mt-1">{submitError}</p>
        </div>
      )}

      {submitSuccess && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <p className="font-medium">Success!</p>
          <p className="mt-1">Your application has been submitted successfully.</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="preferredProgramOffering">
          Preferred Program <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedOfferingId ?? ""}
          onValueChange={(value) => setSelectedOfferingId(value)}
        >
          <SelectTrigger id="preferredProgramOffering" className="w-full">
            <SelectValue
              placeholder={isLoadingPrograms ? "Loading programs..." : "Select preferred program"}
            />
          </SelectTrigger>
          <SelectContent>
            {!isLoadingPrograms && programOfferings.length === 0 && (
              <SelectItem value="none" disabled>
                No open programs available
              </SelectItem>
            )}
            {programOfferings.map((offering) => (
              <SelectItem
                key={offering.id}
                value={offering.documentId ?? String(offering.id)}
              >
                {getProgramOfferingLabel(offering)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting || submitSuccess}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : submitSuccess ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Submitted
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
      </div>
    </div>
  );
}
