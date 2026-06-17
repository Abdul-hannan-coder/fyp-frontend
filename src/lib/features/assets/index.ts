"use client";

import * as React from "react";
import { toast } from "sonner";
import { http, unwrapList } from "@/lib/http";
import { useAsync } from "@/lib/useAsync";
import { invalidateFeature } from "@/lib/cache";

export type Asset = {
  id: string;
  name: string;
  asset_code?: string;
  status?: string;
  condition?: string;
  description?: string;
  category_id?: string;
  room_id?: string | null;
  category?: { id?: string; name: string };
  room?: { id?: string; room_number: string };
};

export type AssetCategory = {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
};

export type AssetAllocation = {
  id: string;
  asset_id: string;
  room_id: string;
  status?: string;
  notes?: string;
  allocated_at?: string;
  asset?: { id?: string; name?: string; asset_code?: string };
  room?: { id?: string; room_number?: string };
  allocator?: { id?: string; full_name?: string };
};

export type AssetMaintenance = {
  id: string;
  asset_id: string;
  maintenance_type?: string;
  description?: string;
  status?: string;
  estimated_cost?: number | string | null;
  actual_cost?: number | string | null;
  reported_at?: string;
  asset?: { id?: string; name?: string; asset_code?: string };
  reporter?: { id?: string; full_name?: string };
  assignee?: { id?: string; full_name?: string };
};

export type AssetHistory = {
  allocations: AssetAllocation[];
  maintenance: AssetMaintenance[];
};

export const ASSET_CONDITIONS = ["excellent", "good", "fair", "poor", "damaged"] as const;
export const ASSET_STATUSES = ["available", "allocated", "maintenance", "retired", "lost"] as const;
export const ALLOCATION_STATUSES = ["active", "returned", "transferred"] as const;
export const MAINTENANCE_TYPES = ["maintenance", "damage", "lost"] as const;
export const MAINTENANCE_STATUSES = ["reported", "in_progress", "resolved"] as const;

export type AssetInput = {
  category_id: string;
  name: string;
  asset_code: string;
  condition?: string;
  status?: string;
  description?: string;
  room_id?: string | null;
};

export type CategoryInput = { name?: string; description?: string; is_active?: boolean };
export type AllocationInput = { asset_id: string; room_id: string; notes?: string; status?: string };
export type MaintenanceInput = {
  asset_id: string;
  maintenance_type?: string;
  description: string;
  estimated_cost?: number;
  status?: string;
  notes?: string;
};

// Defensive unwrap for get-by-id / mutation responses returning { key } or bare entity.
function unwrap<T>(d: unknown, key: string): T {
  if (d && typeof d === "object" && key in (d as Record<string, unknown>)) {
    return (d as Record<string, T>)[key];
  }
  return d as T;
}

export const assetsApi = {
  list: () => http.get<unknown>("/assets?limit=100").then((d) => unwrapList<Asset>(d, "assets")),
  getById: (id: string) =>
    http.get<unknown>(`/assets/${id}`).then((d) => unwrap<Asset>(d, "asset")),
  createAsset: (body: AssetInput) =>
    http.post<unknown>("/assets", body).then((d) => unwrap<Asset>(d, "asset")),
  updateAsset: (id: string, body: Partial<AssetInput>) =>
    http.put<unknown>(`/assets/${id}`, body).then((d) => unwrap<Asset>(d, "asset")),
  deleteAsset: (id: string) => http.del<unknown>(`/assets/${id}`),
  history: (id: string) =>
    http.get<unknown>(`/assets/${id}/history`).then((d) => {
      const obj = (d ?? {}) as Record<string, unknown>;
      return {
        allocations: unwrapList<AssetAllocation>(obj.allocations, "allocations"),
        maintenance: unwrapList<AssetMaintenance>(obj.maintenance, "maintenance"),
      } as AssetHistory;
    }),

  categories: () =>
    http.get<unknown>("/asset-categories").then((d) => unwrapList<AssetCategory>(d, "categories")),
  createCategory: (body: { name: string; description?: string }) =>
    http.post<unknown>("/asset-categories", body).then((d) => unwrap<AssetCategory>(d, "category")),
  updateCategory: (id: string, body: CategoryInput) =>
    http
      .put<unknown>(`/asset-categories/${id}`, body)
      .then((d) => unwrap<AssetCategory>(d, "category")),
  deleteCategory: (id: string) => http.del<unknown>(`/asset-categories/${id}`),

  allocations: () =>
    http
      .get<unknown>("/asset-allocations?limit=100")
      .then((d) => unwrapList<AssetAllocation>(d, "allocations")),
  createAllocation: (body: AllocationInput) =>
    http
      .post<unknown>("/asset-allocations", body)
      .then((d) => unwrap<AssetAllocation>(d, "allocation")),

  maintenance: () =>
    http
      .get<unknown>("/asset-maintenance?limit=100")
      .then((d) => unwrapList<AssetMaintenance>(d, "maintenance")),
  createMaintenance: (body: MaintenanceInput) =>
    http
      .post<unknown>("/asset-maintenance", body)
      .then((d) => unwrap<AssetMaintenance>(d, "maintenance")),
};

export function useAssets() {
  const q = useAsync(() => assetsApi.list(), [], { key: "assets" });
  const catsQ = useAsync(() => assetsApi.categories(), [], { key: "assets:categories" });
  const [busy, setBusy] = React.useState(false);

  const wrap = async (fn: () => Promise<unknown>, ok: string, refetchCats = false) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      invalidateFeature("assets");
      await q.refetch();
      if (refetchCats) await catsQ.refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    assets: q.data ?? [],
    categories: catsQ.data ?? [],
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    busy,
    history: (id: string) => assetsApi.history(id),
    createCategory: (b: { name: string; description?: string }) =>
      wrap(() => assetsApi.createCategory(b), "Category created", true),
    updateCategory: (id: string, b: CategoryInput) =>
      wrap(() => assetsApi.updateCategory(id, b), "Category updated", true),
    deleteCategory: (id: string) =>
      wrap(() => assetsApi.deleteCategory(id), "Category deleted", true),
    createAsset: (b: AssetInput) => wrap(() => assetsApi.createAsset(b), "Asset created"),
    updateAsset: (id: string, b: Partial<AssetInput>) =>
      wrap(() => assetsApi.updateAsset(id, b), "Asset updated"),
    deleteAsset: (id: string) => wrap(() => assetsApi.deleteAsset(id), "Asset deleted"),
  };
}

export function useAssetAllocations() {
  const q = useAsync(() => assetsApi.allocations(), [], { key: "assets:allocations" });
  const [busy, setBusy] = React.useState(false);

  const create = async (b: AllocationInput) => {
    setBusy(true);
    try {
      await assetsApi.createAllocation(b);
      toast.success("Asset allocated");
      invalidateFeature("assets");
      await q.refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    allocations: q.data ?? [],
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    busy,
    create,
  };
}

export function useAssetMaintenance() {
  const q = useAsync(() => assetsApi.maintenance(), [], { key: "assets:maintenance" });
  const [busy, setBusy] = React.useState(false);

  const create = async (b: MaintenanceInput) => {
    setBusy(true);
    try {
      await assetsApi.createMaintenance(b);
      toast.success("Maintenance logged");
      invalidateFeature("assets");
      await q.refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    maintenance: q.data ?? [],
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    busy,
    create,
  };
}
