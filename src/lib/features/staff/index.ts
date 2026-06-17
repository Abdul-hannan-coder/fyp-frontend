"use client";

import * as React from "react";
import { toast } from "sonner";
import { http, unwrapList } from "@/lib/http";
import { useAsync } from "@/lib/useAsync";

// ── Types ──

export type StaffRole = { id: string; name: string; description?: string };

export type StaffMember = {
  id: string;
  name?: string;
  phone?: string;
  employment_status?: string;
  salary_grade?: string;
  user?: { id: string; full_name: string; email: string };
  role?: { id: string; name: string };
  staffRole?: { name: string };
  assignedBlock?: { name: string };
};

export type StaffDuty = {
  id: string;
  staff_id?: string;
  duty_type?: string;
  description?: string;
  priority?: string;
  status?: string;
  end_date?: string;
  notes?: string;
  staff?: { id: string; user?: { full_name: string; email: string } };
};

export type StaffSchedule = {
  id: string;
  staff_id?: string;
  day_of_week?: string;
  shift_start?: string;
  shift_end?: string;
  shift_type?: string;
  is_off_day?: boolean;
  effective_from?: string;
  effective_until?: string;
  notes?: string;
  staff?: { id: string; user?: { full_name: string; email: string } };
};

export const DUTY_TYPES = [
  "floor_patrol",
  "visitor_management",
  "maintenance_supervision",
  "complaint_handling",
  "general",
] as const;
export const DUTY_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export const DUTY_STATUSES = ["pending", "assigned", "in_progress", "completed", "cancelled"] as const;

export const EMPLOYMENT_STATUSES = ["active", "inactive", "on_leave", "terminated"] as const;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export const SHIFT_TYPES = ["morning", "afternoon", "evening", "night", "full_day"] as const;

// ── Input shapes ──

export type RoleCreate = { name: string; description?: string };
export type RoleUpdate = { name?: string; description?: string };

export type MemberCreate = {
  user_id: string;
  staff_role_id: string;
  phone?: string;
  employment_status?: string;
  salary_grade?: string;
};
export type MemberUpdate = {
  staff_role_id?: string;
  phone?: string;
  employment_status?: string;
  salary_grade?: string;
};

export type DutyCreate = {
  staff_id: string;
  duty_type: string;
  description?: string;
  priority?: string;
  status?: string;
  notes?: string;
};
export type DutyUpdate = {
  duty_type?: string;
  description?: string;
  priority?: string;
  status?: string;
  notes?: string;
};

export type ScheduleCreate = {
  staff_id: string;
  day_of_week: string;
  shift_start: string;
  shift_end: string;
  shift_type: string;
  is_off_day?: boolean;
  notes?: string;
};
export type ScheduleUpdate = {
  shift_start?: string;
  shift_end?: string;
  shift_type?: string;
  is_off_day?: boolean;
  notes?: string;
};

// ── Defensive single-entity unwrap ──

function unwrapOne<T>(data: unknown, key: string): T {
  const obj = data as Record<string, unknown> | null;
  if (obj && key in obj) return obj[key] as T;
  return data as T;
}

// ── API ──

export const staffApi = {
  // roles
  roles: () => http.get<unknown>("/staff-roles?limit=100").then((d) => unwrapList<StaffRole>(d, "roles")),
  createRole: (body: RoleCreate) => http.post<unknown>("/staff-roles", body).then((d) => unwrapOne<StaffRole>(d, "role")),
  updateRole: (id: string, body: RoleUpdate) =>
    http.put<unknown>(`/staff-roles/${id}`, body).then((d) => unwrapOne<StaffRole>(d, "role")),
  deleteRole: (id: string) => http.del<unknown>(`/staff-roles/${id}`),

  // members
  list: () => http.get<unknown>("/staff?limit=100").then((d) => unwrapList<StaffMember>(d, "staff")),
  createMember: (body: MemberCreate) =>
    http.post<unknown>("/staff", body).then((d) => unwrapOne<StaffMember>(d, "staff")),
  updateMember: (id: string, body: MemberUpdate) =>
    http.put<unknown>(`/staff/${id}`, body).then((d) => unwrapOne<StaffMember>(d, "staff")),
  deleteMember: (id: string) => http.del<unknown>(`/staff/${id}`),

  // duties
  duties: () => http.get<unknown>("/staff-duties?limit=100").then((d) => unwrapList<StaffDuty>(d, "duties")),
  createDuty: (body: DutyCreate) =>
    http.post<unknown>("/staff-duties", body).then((d) => unwrapOne<StaffDuty>(d, "duty")),
  updateDuty: (id: string, body: DutyUpdate) =>
    http.put<unknown>(`/staff-duties/${id}`, body).then((d) => unwrapOne<StaffDuty>(d, "duty")),
  deleteDuty: (id: string) => http.del<unknown>(`/staff-duties/${id}`),

  // schedules
  schedules: () =>
    http.get<unknown>("/staff-schedules?limit=100").then((d) => unwrapList<StaffSchedule>(d, "schedules")),
  createSchedule: (body: ScheduleCreate) =>
    http.post<unknown>("/staff-schedules", body).then((d) => unwrapOne<StaffSchedule>(d, "schedule")),
  updateSchedule: (id: string, body: ScheduleUpdate) =>
    http.put<unknown>(`/staff-schedules/${id}`, body).then((d) => unwrapOne<StaffSchedule>(d, "schedule")),
  deleteSchedule: (id: string) => http.del<unknown>(`/staff-schedules/${id}`),
};

// ── Hook ──

export function useStaff() {
  const q = useAsync(() => staffApi.list(), []);
  const rolesQ = useAsync(() => staffApi.roles(), []);
  const dutiesQ = useAsync(() => staffApi.duties(), []);
  const schedulesQ = useAsync(() => staffApi.schedules(), []);
  const [busy, setBusy] = React.useState(false);

  const wrap = async (fn: () => Promise<unknown>, ok: string, refetch: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    staff: q.data ?? [],
    roles: rolesQ.data ?? [],
    duties: dutiesQ.data ?? [],
    schedules: schedulesQ.data ?? [],
    loading: q.loading,
    rolesLoading: rolesQ.loading,
    dutiesLoading: dutiesQ.loading,
    schedulesLoading: schedulesQ.loading,
    error: q.error || rolesQ.error || dutiesQ.error || schedulesQ.error,
    refetch: q.refetch,
    busy,

    // roles
    createRole: (b: RoleCreate) => wrap(() => staffApi.createRole(b), "Staff role created", rolesQ.refetch),
    updateRole: (id: string, b: RoleUpdate) => wrap(() => staffApi.updateRole(id, b), "Staff role updated", rolesQ.refetch),
    deleteRole: (id: string) => wrap(() => staffApi.deleteRole(id), "Staff role deleted", rolesQ.refetch),

    // members
    createMember: (b: MemberCreate) => wrap(() => staffApi.createMember(b), "Staff member added", q.refetch),
    updateMember: (id: string, b: MemberUpdate) => wrap(() => staffApi.updateMember(id, b), "Staff member updated", q.refetch),
    deleteMember: (id: string) => wrap(() => staffApi.deleteMember(id), "Staff member removed", q.refetch),

    // duties
    createDuty: (b: DutyCreate) => wrap(() => staffApi.createDuty(b), "Duty assigned", dutiesQ.refetch),
    updateDuty: (id: string, b: DutyUpdate) => wrap(() => staffApi.updateDuty(id, b), "Duty updated", dutiesQ.refetch),
    deleteDuty: (id: string) => wrap(() => staffApi.deleteDuty(id), "Duty deleted", dutiesQ.refetch),

    // schedules
    createSchedule: (b: ScheduleCreate) => wrap(() => staffApi.createSchedule(b), "Schedule created", schedulesQ.refetch),
    updateSchedule: (id: string, b: ScheduleUpdate) =>
      wrap(() => staffApi.updateSchedule(id, b), "Schedule updated", schedulesQ.refetch),
    deleteSchedule: (id: string) => wrap(() => staffApi.deleteSchedule(id), "Schedule deleted", schedulesQ.refetch),
  };
}
