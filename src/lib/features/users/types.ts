import type { RoleName } from "@/lib/features/auth/types";

export type ManagedUser = {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role?: { id: string; name: RoleName };
  is_active: boolean;
  is_verified: boolean;
  is_approved: boolean;
  createdAt?: string;
};

export type UserFilters = {
  role?: RoleName;
  status?: string;
  isApproved?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};
