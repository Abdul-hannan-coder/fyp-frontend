"use client";

import * as React from "react";
import { toast } from "sonner";
import { http, unwrapList } from "@/lib/http";
import { useAsync } from "@/lib/useAsync";

export type LeaveRequest = {
  id: string;
  leave_type_id?: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  student?: { user?: { full_name: string } };
  leaveType?: { name: string };
};

export type AttendanceRow = {
  id: string;
  attendance_date: string;
  status: "present" | "absent" | "leave" | "late" | "medical";
  student?: { user?: { full_name: string } };
};

export type AttendanceSummary = {
  year: number;
  total: number;
  present: number;
  absent: number;
  leave: number;
  medical: number;
  present_percentage: number;
};

export type LeaveBalance = {
  leave_type_id: string;
  leave_type: string;
  allowed_days: number;
  used_days: number;
  remaining_days?: number;
};

export type ApplyLeaveInput = {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
};

export type AttendanceReport = {
  filters?: Record<string, unknown>;
  attendance_total: number;
  attendance_by_status: Record<string, number>;
  leave_requests_total: number;
  leave_by_status: Record<string, number>;
};

export const attendanceApi = {
  myAttendance: () => http.get<unknown>("/attendance/my?limit=100").then((d) => unwrapList<AttendanceRow>(d, "attendance")),
  mySummary: () => http.get<AttendanceSummary>("/attendance/my/summary"),
  myLeave: () => http.get<unknown>("/leave/requests/my?limit=100").then((d) => unwrapList<LeaveRequest>(d, "requests")),
  leaveBalance: () => http.get<LeaveBalance[]>("/leave/balance"),
  applyLeave: (body: ApplyLeaveInput) => http.post<LeaveRequest>("/leave/requests", body),
  cancelLeave: (id: string) => http.patch<LeaveRequest>(`/leave/requests/${id}/cancel`),
  leaveRequests: () => http.get<unknown>("/admin/leave/requests?limit=100").then((d) => unwrapList<LeaveRequest>(d, "requests")),
  dailyAttendance: (date: string) =>
    http.get<unknown>(`/admin/attendance/daily?date=${date}`).then((d) => unwrapList<AttendanceRow>(d, "attendance")),
  reviewLeave: (id: string, status: "approved" | "rejected") =>
    http.patch<LeaveRequest>(`/admin/leave/requests/${id}`, { status }),
  markAttendance: (records: { student_id: string; attendance_date: string; status: string }[]) =>
    http.post<unknown>("/admin/attendance/mark", { records }),
  // Both endpoints return the JSON attendance/leave report (not a binary file).
  exportAttendance: () => http.get<AttendanceReport>("/admin/attendance/export"),
  leaveReport: () => http.get<AttendanceReport>("/admin/leave/report"),
};

/** Build a small CSV from a report and trigger a client-side download. */
function downloadReportCsv(report: AttendanceReport) {
  const rows: string[] = ["section,key,value"];
  rows.push(`summary,attendance_total,${report.attendance_total}`);
  rows.push(`summary,leave_requests_total,${report.leave_requests_total}`);
  for (const [k, v] of Object.entries(report.attendance_by_status ?? {})) rows.push(`attendance_by_status,${k},${v}`);
  for (const [k, v] of Object.entries(report.leave_by_status ?? {})) rows.push(`leave_by_status,${k},${v}`);
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Student: leave requests + attendance summary + balances, with apply/cancel actions. */
export function useMyLeave() {
  const q = useAsync(() => attendanceApi.myLeave(), []);
  const summaryQ = useAsync(() => attendanceApi.mySummary(), []);
  const balanceQ = useAsync(() => attendanceApi.leaveBalance(), []);
  const [busy, setBusy] = React.useState(false);

  const apply = async (body: ApplyLeaveInput) => {
    setBusy(true);
    try {
      await attendanceApi.applyLeave(body);
      toast.success("Leave request submitted");
      await Promise.all([q.refetch(), balanceQ.refetch()]);
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    setBusy(true);
    try {
      await attendanceApi.cancelLeave(id);
      toast.success("Leave request cancelled");
      await q.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return {
    requests: q.data ?? [],
    summary: summaryQ.data ?? null,
    balances: balanceQ.data ?? [],
    loading: q.loading,
    error: q.error,
    busy,
    apply,
    cancel,
  };
}

export function useLeaveReview() {
  const q = useAsync(() => attendanceApi.leaveRequests(), []);
  const [busy, setBusy] = React.useState<string | null>(null);
  const review = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    try {
      await attendanceApi.reviewLeave(id, status);
      toast.success(`Leave ${status}`);
      await q.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };
  return { requests: q.data ?? [], loading: q.loading, error: q.error, busyId: busy, review };
}

/** Admin/Warden: leave report data + export action (downloads a CSV summary). */
export function useAttendanceReport() {
  const q = useAsync(() => attendanceApi.leaveReport(), []);
  const [exporting, setExporting] = React.useState(false);

  const exportAttendance = async () => {
    setExporting(true);
    try {
      const report = await attendanceApi.exportAttendance();
      downloadReportCsv(report);
      toast.success("Attendance report exported");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return { report: q.data, loading: q.loading, error: q.error, exporting, exportAttendance };
}
