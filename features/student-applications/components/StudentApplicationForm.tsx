"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { PaymentMethodRecord } from "@/lib/strapi/payments";

function programIsBlocked(offering: ProgramOffering, blocked: string[]): boolean {
  const p = offering.program;
  if (!p || blocked.length === 0) return false;
  if (p.documentId && blocked.includes(`doc:${p.documentId}`)) return true;
  const pid =
    typeof p.id === "number"
      ? p.id
      : typeof p.id === "string"
        ? Number(p.id)
        : NaN;
  if (Number.isFinite(pid) && blocked.includes(`id:${pid}`)) return true;
  return false;
}

function offeringIsBlocked(offering: ProgramOffering, blockedOfferingKeys: string[]): boolean {
  if (blockedOfferingKeys.length === 0) return false;
  if (offering.documentId && blockedOfferingKeys.includes(`odoc:${offering.documentId}`)) {
    return true;
  }
  const oid =
    typeof offering.id === "number"
      ? offering.id
      : typeof offering.id === "string"
        ? Number(offering.id)
        : NaN;
  if (Number.isFinite(oid) && blockedOfferingKeys.includes(`oid:${oid}`)) {
    return true;
  }
  return false;
}

function formatEtb(amount: number): string {
  return new Intl.NumberFormat("en-ET", { maximumFractionDigits: 2 }).format(amount);
}

function feeAmount(offering: ProgramOffering | undefined): number | null {
  if (!offering) return null;
  const raw = offering.applicationFee;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) return null;
  return raw;
}

export type StudentApplicationFormProps = {
  /** `doc:...` / `id:...` keys for programs that already have an application */
  blockedProgramKeys?: string[];
  /** `odoc:...` / `oid:...` keys for program offerings that already have an application */
  blockedOfferingKeys?: string[];
};

export function StudentApplicationForm({
  blockedProgramKeys = [],
  blockedOfferingKeys = [],
}: StudentApplicationFormProps) {
  const router = useRouter();
  const [programOfferings, setProgramOfferings] = useState<ProgramOffering[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [receiptMediaId, setReceiptMediaId] = useState<number | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [paymentWarning, setPaymentWarning] = useState<string | null>(null);

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

  useEffect(() => {
    const loadMethods = async () => {
      setIsLoadingPaymentMethods(true);
      try {
        const res = await fetch("/api/payment-methods");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || "Failed to load payment methods");
        }
        setPaymentMethods(Array.isArray(json?.data) ? json.data : []);
      } catch {
        setPaymentMethods([]);
      } finally {
        setIsLoadingPaymentMethods(false);
      }
    };
    loadMethods();
  }, []);

  const selectableOfferings = useMemo(
    () =>
      programOfferings.filter(
        (o) =>
          !programIsBlocked(o, blockedProgramKeys) && !offeringIsBlocked(o, blockedOfferingKeys)
      ),
    [programOfferings, blockedProgramKeys, blockedOfferingKeys]
  );

  useEffect(() => {
    if (!selectedOfferingId) return;
    const stillValid = selectableOfferings.some(
      (o) => (o.documentId ?? String(o.id)) === selectedOfferingId
    );
    if (!stillValid) {
      setSelectedOfferingId(null);
    }
  }, [selectableOfferings, selectedOfferingId]);

  const selectedOffering = useMemo(
    () =>
      selectableOfferings.find((o) => (o.documentId ?? String(o.id)) === selectedOfferingId),
    [selectableOfferings, selectedOfferingId]
  );

  const requiredFee = useMemo(() => feeAmount(selectedOffering), [selectedOffering]);

  const selectedPaymentMethod = useMemo(
    () =>
      paymentMethods.find(
        (m) => (m.documentId ? String(m.documentId) : String(m.id)) === selectedPaymentMethodId
      ),
    [paymentMethods, selectedPaymentMethodId]
  );

  useEffect(() => {
    setReceiptMediaId(null);
    setReceiptError(null);
    setTransactionId("");
    setSelectedPaymentMethodId(null);
    setSubmitSuccess(false);
    setPaymentWarning(null);
  }, [selectedOfferingId]);

  const getProgramOfferingLabel = (offering: ProgramOffering) => {
    const programName = offering.program?.name || offering.program?.fullName || "Program";
    const batchLabel = offering.batch?.code || offering.batch?.name || "";
    const calendarLabel =
      offering.academic_calendar?.academicYearRange || offering.academic_calendar?.name || "";
    const capacityRemaining =
      typeof offering.capacityRemaining === "number" ? offering.capacityRemaining : null;
    const fee = feeAmount(offering);
    const parts = [programName, batchLabel, calendarLabel].filter(Boolean);
    let label = parts.join(" - ");
    if (fee != null) {
      label += ` — ${formatEtb(fee)} ETB fee`;
    }
    return capacityRemaining === null ? label : `${label} (${capacityRemaining} seats left)`;
  };

  const paymentMethodLabel = (m: PaymentMethodRecord) => {
    const t = String(m.type || "").toUpperCase();
    if (t === "BANK") {
      return `Bank — ${m.name || m.accountName || "Account"}`;
    }
    if (t === "TELEBIRR") {
      return `Telebirr — ${m.telebirrName || m.telebirrNumber || "Telebirr"}`;
    }
    return `${t} — ${m.name || m.id}`;
  };

  const handleReceiptFile = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      setReceiptMediaId(null);
      setReceiptError(null);
      return;
    }
    setReceiptUploading(true);
    setReceiptError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to upload receipt");
      }
      const id = typeof result.id === "number" ? result.id : Number(result.id);
      if (!Number.isFinite(id)) {
        throw new Error("Upload did not return a file id");
      }
      setReceiptMediaId(id);
    } catch (e) {
      setReceiptMediaId(null);
      setReceiptError(e instanceof Error ? e.message : "Receipt upload failed");
    } finally {
      setReceiptUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOfferingId) {
      setSubmitError("Please select a program offering.");
      return;
    }

    const selected = selectableOfferings.find(
      (o) => (o.documentId ?? String(o.id)) === selectedOfferingId
    );

    const fee = feeAmount(selected);
    if (fee != null) {
      if (!selectedPaymentMethodId) {
        setSubmitError("Please select a payment method.");
        return;
      }
      if (!transactionId.trim()) {
        setSubmitError("Please enter your transaction or transfer reference.");
        return;
      }
      if (receiptMediaId == null) {
        setSubmitError("Please upload a payment receipt (image or PDF).");
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setPaymentWarning(null);

    try {
      const body: Record<string, unknown> = {
        programOfferingId: selectedOfferingId,
        ...(typeof selected?.id === "number" && {
          programOfferingNumericId: selected.id,
        }),
        applicationStatus: "Submitted",
      };

      if (fee != null && selectedPaymentMethod && receiptMediaId != null) {
        body.payment = {
          paymentMethodId: selectedPaymentMethod.documentId ?? String(selectedPaymentMethod.id),
          paymentMethodNumericId: selectedPaymentMethod.id,
          transactionId: transactionId.trim(),
          receiptId: receiptMediaId,
        };
      }

      const response = await fetch("/api/student-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: body }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof result.error === "string" ? result.error : "Failed to submit application"
        );
      }

      if (result.paymentError) {
        setSubmitSuccess(true);
        setPaymentWarning(
          typeof result.paymentError === "string"
            ? result.paymentError
            : "Payment could not be recorded. Your application may still be saved—contact admissions."
        );
      } else {
        setSubmitSuccess(true);
      }
      router.refresh();
      setTimeout(() => {
        document
          .getElementById("your-applications")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
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
          Select your preferred program offering and submit your application. You can apply to
          multiple programs; each academic program can only have one application. If the program
          lists an application fee, complete the payment section using an active bank or Telebirr
          method.
        </p>
      </div>

      {!isLoadingPrograms &&
        programOfferings.length > 0 &&
        selectableOfferings.length === 0 && (
          <div className="rounded-md border border-muted-foreground/30 bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            You already have an application for every program in the current list. If you need to
            change an application, contact admissions.
          </div>
        )}

      {submitError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">Error</p>
          <p className="mt-1">{submitError}</p>
        </div>
      )}

      {submitSuccess && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <p className="font-medium">Success</p>
          <p className="mt-1">Your application has been submitted successfully.</p>
          {paymentWarning && (
            <p className="mt-2 border-t border-green-600/20 pt-2 text-amber-800 dark:text-amber-200">
              {paymentWarning}
            </p>
          )}
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
            {selectableOfferings.map((offering) => (
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

      {selectedOffering && requiredFee != null && (
        <div className="space-y-4 rounded-md border bg-muted/30 p-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Application fee</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This program requires a non-refundable application fee of{" "}
              <span className="font-medium text-foreground">{formatEtb(requiredFee)} ETB</span>.
              Pay using one of the methods below, then enter your transaction reference and upload
              proof of payment.
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              Payment method <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedPaymentMethodId ?? ""}
              onValueChange={(v) => setSelectedPaymentMethodId(v)}
              disabled={isLoadingPaymentMethods || paymentMethods.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isLoadingPaymentMethods ? "Loading methods..." : "Select payment method"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem
                    key={m.id}
                    value={m.documentId ? String(m.documentId) : String(m.id)}
                  >
                    {paymentMethodLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPaymentMethod && (
            <div className="rounded-md border bg-background p-3 text-sm">
              <p className="font-medium text-foreground">Payment instructions</p>
              {String(selectedPaymentMethod.type || "").toUpperCase() === "BANK" && (
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  {selectedPaymentMethod.name && <li>Bank: {selectedPaymentMethod.name}</li>}
                  {selectedPaymentMethod.accountName && (
                    <li>Account name: {selectedPaymentMethod.accountName}</li>
                  )}
                  {selectedPaymentMethod.accountNumber && (
                    <li>Account number: {selectedPaymentMethod.accountNumber}</li>
                  )}
                </ul>
              )}
              {String(selectedPaymentMethod.type || "").toUpperCase() === "TELEBIRR" && (
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  {selectedPaymentMethod.telebirrName && (
                    <li>Recipient: {selectedPaymentMethod.telebirrName}</li>
                  )}
                  {selectedPaymentMethod.telebirrNumber && (
                    <li>Telebirr number: {selectedPaymentMethod.telebirrNumber}</li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="transactionId">
              Transaction / reference number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. FT260947WHDH"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt">
              Payment receipt <span className="text-destructive">*</span>
            </Label>
            <Input
              id="receipt"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={receiptUploading}
              onChange={(e) => void handleReceiptFile(e.target.files)}
            />
            {receiptUploading && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
              </p>
            )}
            {receiptError && <p className="text-xs text-destructive">{receiptError}</p>}
            {receiptMediaId != null && !receiptUploading && (
              <p className="text-xs text-green-700 dark:text-green-400">Receipt uploaded.</p>
            )}
          </div>
        </div>
      )}

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
