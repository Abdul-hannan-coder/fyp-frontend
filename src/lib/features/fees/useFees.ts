"use client";

import * as React from "react";
import { toast } from "sonner";
import { useAsync } from "@/lib/useAsync";
import { invalidateFeature } from "@/lib/cache";
import { feesApi, refundsApi, downloadPaymentReceipt, type CreateFeeStructureInput } from "./api";
import type { CreateRefundInput, PaymentSummary, RecordPaymentInput } from "./types";

export function useFeeStructures() {
  const q = useAsync(() => feesApi.listStructures(), [], { key: "fees:structures" });
  const [busy, setBusy] = React.useState(false);

  const create = async (input: CreateFeeStructureInput) => {
    setBusy(true);
    try {
      await feesApi.createStructure(input);
      toast.success("Fee structure created");
      invalidateFeature("fees");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { structures: q.data ?? [], loading: q.loading, error: q.error, busy, create };
}

export function usePayments(params: { student_id?: string; status?: string } = {}) {
  const paramKey = JSON.stringify(params);
  const cacheKey = params.student_id
    ? `fees:student:${params.student_id}`
    : `fees:payments${params.status ? `:${params.status}` : ""}`;
  const q = useAsync(() => feesApi.listPayments(params), [paramKey], { key: cacheKey });
  const [busy, setBusy] = React.useState<string | null>(null);

  const verify = async (id: string, status: "paid" | "rejected", remarks?: string) => {
    setBusy(id);
    try {
      await feesApi.verifyPayment(id, status, remarks);
      toast.success(status === "paid" ? "Payment verified" : "Payment rejected");
      invalidateFeature("fees");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return { payments: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch, busyId: busy, verify };
}

// Admin: a single payment (used by the finance detail page).
export function usePayment(id: string) {
  const q = useAsync(() => feesApi.getPayment(id), [id], { key: `fees:${id}`, enabled: !!id });
  return { payment: q.data, loading: q.loading, error: q.error, refetch: q.refetch };
}

export function useMyPayments() {
  const q = useAsync(() => feesApi.myPayments(), [], { key: "fees:my" });
  const [submitting, setSubmitting] = React.useState(false);

  const pay = async (input: RecordPaymentInput) => {
    setSubmitting(true);
    try {
      await feesApi.recordPayment(input);
      toast.success("Payment submitted");
      invalidateFeature("fees");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const uploadProof = async (paymentId: string, file: File, transactionId?: string) => {
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("proof", file);
      if (transactionId) form.append("transaction_id", transactionId);
      await feesApi.uploadProof(paymentId, form);
      toast.success("Payment proof uploaded — pending verification");
      invalidateFeature("fees");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const downloadReceipt = async (paymentId: string, receiptNumber?: string | null) => {
    setSubmitting(true);
    try {
      await downloadPaymentReceipt(paymentId, receiptNumber);
      toast.success("Receipt downloaded");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { payments: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch, submitting, pay, uploadProof, downloadReceipt };
}

// Admin payment utilities: per-student summary + recalculate late fees.
export function usePaymentAdmin() {
  const [summary, setSummary] = React.useState<PaymentSummary | null>(null);
  const [recalculating, setRecalculating] = React.useState(false);

  const loadSummary = async () => {
    try {
      setSummary(await feesApi.paymentsSummary());
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const recalcLateFees = async (onDone?: () => void | Promise<void>) => {
    setRecalculating(true);
    try {
      const { count } = await feesApi.calculateLateFees();
      toast.success(`Late fees recalculated for ${count} payment(s)`);
      invalidateFeature("fees");
      await onDone?.();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setRecalculating(false);
    }
  };

  return { summary, loadSummary, recalculating, recalcLateFees };
}

// Payment proofs for one payment: list + admin verify/reject (toast + refetch).
export function usePaymentProofs(paymentId: string | null) {
  const q = useAsync(
    () => (paymentId ? feesApi.listProofs(paymentId) : Promise.resolve([])),
    [paymentId ?? ""],
    { key: paymentId ? `fees:proofs:${paymentId}` : undefined, enabled: !!paymentId },
  );
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const verify = async (proofId: string, remarks?: string) => {
    setBusyId(proofId);
    try {
      await feesApi.verifyProof(proofId, remarks ? { remarks } : {});
      toast.success("Payment proof verified");
      invalidateFeature("fees");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (proofId: string, remarks: string) => {
    setBusyId(proofId);
    try {
      await feesApi.rejectProof(proofId, { remarks });
      toast.success("Payment proof rejected");
      invalidateFeature("fees");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  return { proofs: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch, busyId, verify, reject };
}

// Admin/warden refunds: full list + review (approve/reject) + process workflow + create.
export function useRefunds() {
  const q = useAsync(() => refundsApi.list(), [], { key: "refunds" });
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const wrap = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(ok);
      invalidateFeature("refunds");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const create = async (input: CreateRefundInput) => {
    setSubmitting(true);
    try {
      await refundsApi.create(input);
      toast.success("Refund request created");
      invalidateFeature("refunds");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    refunds: q.data ?? [],
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    busyId,
    submitting,
    create,
    review: (id: string, status: "approved" | "rejected", remarks?: string) =>
      wrap(id, () => refundsApi.review(id, status, remarks), status === "approved" ? "Refund approved" : "Refund rejected"),
    process: (id: string) => wrap(id, () => refundsApi.process(id), "Refund marked processed"),
  };
}

// Admin/warden: a single refund (used by the refund detail page).
export function useRefund(id: string) {
  const q = useAsync(() => refundsApi.get(id), [id], { key: `refunds:${id}`, enabled: !!id });
  return { refund: q.data, loading: q.loading, error: q.error, refetch: q.refetch };
}

// Student refunds: view own requests + request a refund against a paid payment.
export function useMyRefunds() {
  const q = useAsync(() => refundsApi.myList(), [], { key: "refunds:my" });
  const [submitting, setSubmitting] = React.useState(false);

  const request = async (input: CreateRefundInput) => {
    setSubmitting(true);
    try {
      await refundsApi.create(input);
      toast.success("Refund request submitted");
      invalidateFeature("refunds");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { refunds: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch, submitting, request };
}
