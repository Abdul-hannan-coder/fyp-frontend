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

// Shape returned by GET /visitors/report (visitor.service.generateVisitorReport).
export type VisitorReport = {
  total_visitors: number;
  checked_in: number;
  checked_out: number;
  cancelled: number;
  by_date: Record<string, number>;
};

function unwrap<T>(d: unknown, key: string): T {
  if (d && typeof d === "object" && key in (d as Record<string, unknown>)) {
    return (d as Record<string, T>)[key];
  }
  return d as T;
}

export const visitorsApi = {
  today: () => http.get<unknown>("/visitors/today?limit=100").then((d) => unwrapList<Visitor>(d, "visitors")),
  list: () => http.get<unknown>("/visitors?limit=100").then((d) => unwrapList<Visitor>(d, "visitors")),
  mine: () => http.get<unknown>("/visitors/my?limit=100").then((d) => unwrapList<Visitor>(d, "visitors")),
  register: (body: { name: string; phone: string; purpose: string; visit_date: string; room_number: string }) =>
    http.post<Visitor>("/visitors/register", body),
  checkout: (id: string) => http.patch<Visitor>(`/visitors/${id}/checkout`, { notes: "checked out" }),
  report: (startDate: string, endDate: string) =>
    http
      .get<unknown>(`/visitors/report?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`)
      .then((d) => {
        const r = unwrap<Partial<VisitorReport>>(d, "report") ?? {};
        return {
          total_visitors: r.total_visitors ?? 0,
          checked_in: r.checked_in ?? 0,
          checked_out: r.checked_out ?? 0,
          cancelled: r.cancelled ?? 0,
          by_date: r.by_date ?? {},
        } as VisitorReport;
      }),
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

export function useVisitorReport(startDate: string, endDate: string) {
  const enabled = !!startDate && !!endDate;
  const q = useAsync(() => visitorsApi.report(startDate, endDate), [startDate, endDate], { enabled });
  return { report: q.data, loading: q.loading, error: q.error, refetch: q.refetch };
}
