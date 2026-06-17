"use client";

import * as React from "react";
import { toast } from "sonner";
import { useAsync } from "@/lib/useAsync";
import { allocationApi } from "./api";

export function useMyAllocation() {
  const q = useAsync(() => allocationApi.myAllocation(), []);
  return { allocation: q.data, loading: q.loading, error: q.error, refetch: q.refetch };
}

export function useAllocationRequests(status?: string) {
  const q = useAsync(() => allocationApi.listRequests({ status }), [status ?? ""]);
  const [busy, setBusy] = React.useState<string | null>(null);

  const review = async (id: string, decision: "approved" | "rejected", remarks?: string) => {
    setBusy(id);
    try {
      await allocationApi.reviewRequest(id, decision, remarks);
      toast.success(decision === "approved" ? "Request approved" : "Request rejected");
      await q.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return { requests: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch, busyId: busy, review };
}

// Admin/warden: reserve the room a user selected at signup.
export function useReserveRoom(onDone?: () => void) {
  const [busy, setBusy] = React.useState(false);

  const reserve = async (user_id: string) => {
    setBusy(true);
    try {
      const result = await allocationApi.reserve({ user_id });
      toast.success(
        result.amount_due != null
          ? `Room reserved — payment of ${result.amount_due} raised`
          : "Room reserved",
      );
      onDone?.();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { busy, reserve };
}
