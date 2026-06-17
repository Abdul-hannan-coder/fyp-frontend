"use client";

import * as React from "react";
import { toast } from "sonner";
import { http, unwrapList } from "@/lib/http";
import { useAsync } from "@/lib/useAsync";

export type Visitor = {
  id: string;
  name: string;
  phone?: string;
  purpose?: string;
  visit_date?: string;
  room_number?: string;
  check_in_time?: string;
  status: "checked_in" | "checked_out" | "cancelled";
  student?: { student_id?: string; user?: { full_name: string } };
};

export const visitorsApi = {
  today: () => http.get<unknown>("/visitors/today?limit=100").then((d) => unwrapList<Visitor>(d, "visitors")),
  list: () => http.get<unknown>("/visitors?limit=100").then((d) => unwrapList<Visitor>(d, "visitors")),
  mine: () => http.get<unknown>("/visitors/my?limit=100").then((d) => unwrapList<Visitor>(d, "visitors")),
  register: (body: { name: string; phone: string; purpose: string; visit_date: string; room_number: string }) =>
    http.post<Visitor>("/visitors/register", body),
  checkout: (id: string) => http.patch<Visitor>(`/visitors/${id}/checkout`, { notes: "checked out" }),
};

export function useVisitors(scope: "today" | "all" | "mine" = "today") {
  const q = useAsync(
    () => (scope === "mine" ? visitorsApi.mine() : scope === "all" ? visitorsApi.list() : visitorsApi.today()),
    [scope],
  );
  const [busy, setBusy] = React.useState<string | null>(null);

  const checkout = async (id: string) => {
    setBusy(id);
    try {
      await visitorsApi.checkout(id);
      toast.success("Visitor checked out");
      await q.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return { visitors: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch, busyId: busy, checkout };
}
