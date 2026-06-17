"use client";

import * as React from "react";
import { toast } from "sonner";
import { useAsync } from "@/lib/useAsync";
import { transfersApi } from "./api";

// Student-side: own transfer requests + create/cancel.
export function useMyTransfers() {
  const q = useAsync(() => transfersApi.listMine(), []);
  const [busy, setBusy] = React.useState<string | null>(null);

  const create = async (body: { reason: string; to_room_id?: string; preferred_room_type_id?: string }) => {
    setBusy("create");
    try {
      await transfersApi.create(body);
      toast.success("Transfer request submitted");
      await q.refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const cancel = async (id: string) => {
    setBusy(id);
    try {
      await transfersApi.cancel(id);
      toast.success("Transfer request cancelled");
      await q.refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  return {
    transfers: q.data ?? [],
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    busy,
    create,
    cancel,
  };
}

// Staff-side: full queue + review/complete.
export function useTransfers(status?: string) {
  const q = useAsync(() => transfersApi.listAll({ status }), [status ?? ""]);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const review = async (id: string, decision: "approved" | "rejected", remarks?: string) => {
    setBusyId(id);
    try {
      await transfersApi.review(id, decision, remarks);
      toast.success(decision === "approved" ? "Transfer approved" : "Transfer rejected");
      await q.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const complete = async (id: string) => {
    setBusyId(id);
    try {
      await transfersApi.complete(id);
      toast.success("Transfer completed");
      await q.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return {
    transfers: q.data ?? [],
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    busyId,
    review,
    complete,
  };
}
