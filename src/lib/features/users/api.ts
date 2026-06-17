import { http, unwrapList } from "@/lib/http";
import type { ManagedUser, UserFilters } from "./types";

function qs(filters: UserFilters = {}) {
  const p = new URLSearchParams();
  if (filters.role) p.set("role", filters.role);
  if (filters.status) p.set("status", filters.status);
  if (filters.isApproved !== undefined) p.set("isApproved", String(filters.isApproved));
  if (filters.search) p.set("search", filters.search);
  p.set("page", String(filters.page ?? 1));
  p.set("limit", String(filters.limit ?? 100));
  return p.toString();
}

export type CreateAccountInput = {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role_name: "student" | "warden" | "staff";
};

export const usersApi = {
  list: (filters?: UserFilters) =>
    http.get<unknown>(`/auth/users?${qs(filters)}`).then((d) => unwrapList<ManagedUser>(d, "users")),
  // Admin create: ready-to-use account (verified + approved), credentials emailed.
  create: (body: CreateAccountInput) =>
    http.post<{ user: ManagedUser }>("/auth/admin/users", body).then((d) => d.user),
  get: (id: string) => http.get<{ user: ManagedUser }>(`/auth/users/${id}`).then((d) => d.user),
  approve: (id: string) => http.patch<ManagedUser>(`/auth/users/${id}/approve`),
  reject: (id: string, deactivation_reason: string) =>
    http.patch<ManagedUser>(`/auth/users/${id}/reject`, { deactivation_reason }),
  activate: (id: string) => http.patch<ManagedUser>(`/auth/users/${id}/activate`),
  deactivate: (id: string, deactivation_reason: string) =>
    http.patch<ManagedUser>(`/auth/users/${id}/deactivate`, { deactivation_reason }),
  remove: (id: string) => http.del<null>(`/auth/users/${id}`),
};
