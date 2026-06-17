"use client";

import * as React from "react";
import { toast } from "sonner";
import { useAsync } from "@/lib/useAsync";
import { feesApi, refundsApi, downloadPaymentReceipt, type CreateFeeStructureInput } from "./api";
import type { CreateRefundInput, RecordPaymentInput } from "./types";

export function useFeeStructures() {
  const q = useAsync(() => feesApi.listStructures(), []);
  const [busy, setBusy] = React.useState(false);

  const create = async (input: CreateFeeStructureInput) => {
    setBusy(true);
    try {
      await feesApi.createStructure(input);
      toast.success("Fee structure created");
      await q.refetch();
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
  const key = JSON.stringify(params);
  const q = useAsync(() => feesApi.listPayments(params), [key]);
  const [busy, setBusy] = React.useState<string | null>(null);

  const verify = async (id: string, status: "paid" | "rejected", remarks?: string) => {
    setBusy(id);
    try {
      await feesApi.verifyPayment(id, status, remarks);
      toast.success(status === "paid" ? "Payment verified" : "Payment rejected");
      await q.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return { payments: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch, busyId: busy, verify };
}

export function useMyPayments() {
  const q = useAsync(() => feesApi.myPayments(), []);
  const [submitting, setSubmitting] = React.useState(false);

  const pay = async (input: RecordPaymentInput) => {
    setSubmitting(true);
    try {
      await feesApi.recordPayment(input);
      toast.success("Payment submitted");
      await q.refetch();
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
      await q.refetch();
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

// Admin/warden refunds: full list + review (approve/reject) + process workflow + create.
export function useRefunds() {
  const q = useAsync(() => refundsApi.list(), []);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const wrap = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(ok);
      await q.refetch();
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
      await q.refetch();
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

// Student refunds: view own requests + request a refund against a paid payment.
export function useMyRefunds() {
  const q = useAsync(() => refundsApi.myList(), []);
  const [submitting, setSubmitting] = React.useState(false);

  const request = async (input: CreateRefundInput) => {
    setSubmitting(true);
    try {
      await refundsApi.create(input);
      toast.success("Refund request submitted");
      await q.refetch();
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
