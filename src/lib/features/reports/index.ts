"use client";

import * as React from "react";
import { toast } from "sonner";
import { API_URL, http, tokenStore, unwrapList } from "@/lib/http";
import { useAsync } from "@/lib/useAsync";

// ── Dashboard metric shapes (GET /reports/dashboards/:type) ──
export type OccupancyMetrics = {
  total_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
  by_floor?: { floor_id: string; total_rooms: number }[];
  by_type?: { room_type_id: string; total_rooms: number }[];
};
export type RevenueMetrics = {
  total_due: number;
  collected: number;
  pending_payments: number;
  collection_rate: number;
};
export type AttendanceMetrics = {
  total_marks: number;
  present: number;
  attendance_rate: number;
};
export type VisitorMetrics = {
  total_visitors: number;
  checked_out: number;
  cancelled: number;
  currently_inside: number;
  checkout_rate: number;
};
export type OverviewMetrics = {
  occupancy: OccupancyMetrics;
  revenue: RevenueMetrics;
  attendance: AttendanceMetrics;
  visitor: VisitorMetrics;
};

export type FeeDashboard = {
  total_collected: number;
  total_pending: number;
  total_overdue: number;
  payment_count: number;
  paid_count: number;
  pending_count: number;
  refund_count: number;
  collection_rate: number;
};

export type SupportDashboard = {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  by_category?: Record<string, number>;
  by_priority?: Record<string, number>;
};

// ── Generated reports (CRUD + export) ──

// report_type values accepted by POST /reports (backend validation).
export const REPORT_TYPES = [
  "overview",
  "occupancy",
  "revenue",
  "attendance",
  "visitor",
  "staff",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export type ExportFormat = "pdf" | "csv";

// A persisted report row (GET /reports, POST /reports, GET /reports/:id).
export type GeneratedReport = {
  id: string;
  report_type: string;
  title?: string | null;
  filters?: Record<string, unknown>;
  data?: Record<string, unknown>;
  generated_by?: string | null;
  generated_at?: string;
  created_at?: string;
};

// GET /reports → { total, page, limit, pages, reports: [...] }
export type ReportListResponse = {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  reports?: GeneratedReport[];
};

export type GenerateReportInput = {
  report_type: ReportType;
  filters?: Record<string, unknown>;
};

// A KPI row (GET /reports/dashboards/kpi/:moduleName).
export type Kpi = {
  id: string;
  module_name: string;
  metric_name: string;
  current_value: string | number;
  target_value?: string | number | null;
  unit?: string | null;
  trend: "up" | "down" | "stable";
  last_updated?: string;
};

// Single get-by-id endpoints return either a bare entity or { entity }.
function unwrapOne<T>(data: unknown, key: string): T {
  const obj = data as Record<string, unknown> | null;
  if (obj && key in obj) return obj[key] as T;
  return data as T;
}

export const reportsApi = {
  dashboard: <T>(type: string) => http.get<T>(`/reports/dashboards/${type}`),
  feeDashboard: () => http.get<FeeDashboard>("/fees/dashboard"),
  supportDashboard: () => http.get<SupportDashboard>("/support/dashboard"),

  list: () =>
    http
      .get<unknown>("/reports?limit=100")
      .then((d) => unwrapList<GeneratedReport>(d, "reports")),
  generate: (body: GenerateReportInput) =>
    http.post<unknown>("/reports", body).then((d) => unwrapOne<GeneratedReport>(d, "report")),
  get: (id: string) =>
    http.get<unknown>(`/reports/${id}`).then((d) => unwrapOne<GeneratedReport>(d, "report")),
  remove: (id: string) => http.del<{ id: string }>(`/reports/${id}`),
  kpi: (moduleName: string) =>
    http
      .get<unknown>(`/reports/dashboards/kpi/${encodeURIComponent(moduleName)}`)
      .then((d) => unwrapList<Kpi>(d, "kpis")),

  // Export returns a raw binary (PDF) / text (CSV) attachment — NOT the JSON
  // envelope — so it bypasses `http` and uses a raw fetch + blob download.
  export: (id: string, format: ExportFormat) => downloadReport(id, format),
};

/**
 * Download a generated report as a file. The backend's POST /reports/:id/export
 * streams the file directly (Content-Disposition: attachment) — PDF as a binary
 * buffer, CSV as text — so we fetch the blob and trigger an anchor download.
 */
export async function downloadReport(id: string, format: ExportFormat): Promise<void> {
  const headers: Record<string, string> = {};
  if (tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;

  const res = await fetch(`${API_URL}/reports/${id}/export?format=${format}`, {
    method: "POST",
    headers,
  });

  if (!res.ok) {
    // Error responses are JSON envelopes; surface the message if present.
    let message = `Export failed (${res.status})`;
    try {
      const json = (await res.json()) as { message?: string };
      if (json?.message) message = json.message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${id}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// The overview dashboard powers admin + warden home pages.
export function useOverview() {
  const q = useAsync(() => reportsApi.dashboard<OverviewMetrics>("overview"), []);
  return { overview: q.data, loading: q.loading, error: q.error, refetch: q.refetch };
}

export function useFeeDashboard() {
  const q = useAsync(() => reportsApi.feeDashboard(), []);
  return { fees: q.data, loading: q.loading, error: q.error, refetch: q.refetch };
}

export function useSupportDashboard() {
  const q = useAsync(() => reportsApi.supportDashboard(), []);
  return { support: q.data, loading: q.loading, error: q.error };
}

// Generated-report management: list + generate + delete + export.
export function useReports() {
  const q = useAsync(() => reportsApi.list(), []);
  const [busy, setBusy] = React.useState(false);
  const [exportingId, setExportingId] = React.useState<string | null>(null);

  const wrap = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await q.refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const exportReport = async (id: string, format: ExportFormat) => {
    setExportingId(id);
    try {
      await reportsApi.export(id, format);
      toast.success(`Exported as ${format.toUpperCase()}`);
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setExportingId(null);
    }
  };

  return {
    reports: q.data ?? [],
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    busy,
    exportingId,
    generate: (b: GenerateReportInput) => wrap(() => reportsApi.generate(b), "Report generated"),
    remove: (id: string) => wrap(() => reportsApi.remove(id), "Report deleted"),
    exportReport,
  };
}

// KPI metrics for a single module, loaded on demand.
export function useKpis(moduleName: string, enabled = true) {
  const q = useAsync(
    () => reportsApi.kpi(moduleName),
    [moduleName],
    { enabled: enabled && !!moduleName },
  );
  return { kpis: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch };
}
