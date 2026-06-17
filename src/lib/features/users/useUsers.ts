"use client";

import * as React from "react";
import { toast } from "sonner";
import { useAsync } from "@/lib/useAsync";
import { usersApi, type CreateAccountInput } from "./api";
import type { UserFilters } from "./types";

export function useUsers(filters: UserFilters = {}) {
  const key = JSON.stringify(filters);
  const q = useAsync(() => usersApi.list(filters), [key]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  const wrap = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    try {
      await fn();
      toast.success(ok);
      await q.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const create = async (input: CreateAccountInput) => {
    setCreating(true);
    try {
      const user = await usersApi.create(input);
      toast.success(`${input.role_name} account created — credentials emailed`);
      await q.refetch();
      return user;
    } catch (err) {
      const e = err as { message: string; errors?: { message: string }[] };
      toast.error(e.errors?.[0]?.message || e.message);
      return null;
    } finally {
      setCreating(false);
    }
  };

  return {
    users: q.data ?? [],
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    busyId: busy,
    creating,
    create,
    approve: (id: string) => wrap(id, () => usersApi.approve(id), "User approved — credentials emailed"),
    reject: (id: string, reason: string) => wrap(id, () => usersApi.reject(id, reason), "Application rejected"),
    activate: (id: string) => wrap(id, () => usersApi.activate(id), "User activated"),
    deactivate: (id: string, reason: string) => wrap(id, () => usersApi.deactivate(id, reason), "User deactivated"),
    remove: (id: string) => wrap(id, () => usersApi.remove(id), "Account deleted"),
  };
}
