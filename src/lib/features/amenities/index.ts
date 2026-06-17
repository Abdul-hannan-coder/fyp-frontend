"use client";

import * as React from "react";
import { toast } from "sonner";
import { http, unwrapList } from "@/lib/http";
import { useAsync } from "@/lib/useAsync";
import { invalidateFeature } from "@/lib/cache";

export type Amenity = {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  icon?: string | null;
  is_active?: boolean;
};

export type AmenityInput = {
  name: string;
  price: number;
  description?: string;
  icon?: string;
};

export const amenitiesApi = {
  list: () => http.get<unknown>("/amenities?limit=200").then((d) => unwrapList<Amenity>(d, "amenities")),
  create: (body: AmenityInput) => http.post<{ amenity: Amenity }>("/amenities", body),
  update: (id: string, body: Partial<AmenityInput>) => http.put<{ amenity: Amenity }>(`/amenities/${id}`, body),
  remove: (id: string) => http.del<null>(`/amenities/${id}`),
};

export function useAmenities() {
  const q = useAsync(() => amenitiesApi.list(), [], { key: "amenities" });
  const [busy, setBusy] = React.useState(false);

  const wrap = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      invalidateFeature("amenities");
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
    amenities: q.data ?? [],
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    busy,
    create: (b: AmenityInput) => wrap(() => amenitiesApi.create(b), "Amenity added"),
    update: (id: string, b: Partial<AmenityInput>) => wrap(() => amenitiesApi.update(id, b), "Amenity updated"),
    remove: (id: string) => wrap(() => amenitiesApi.remove(id), "Amenity removed"),
  };
}
