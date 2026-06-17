"use client";

import { http } from "@/lib/http";
import { useAsync } from "@/lib/useAsync";

export type PublicAmenity = { id: string; name: string; price: string | number };
export type PublicRoomType = {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  bed_type?: string | null;
  size_sqft?: number | null;
  base_price: string;
  amenities: PublicAmenity[];
  amenities_price?: number;
  total_price?: number;
  images?: { id: string; image_url: string }[];
  total_rooms: number;
  available_count: number;
};

export type PublicOverview = {
  residents: number;
  blocks: number;
  room_types: number;
  total_rooms: number;
  occupancy_rate: number;
};

// ── Published room packages (the e-commerce "browse rooms" catalogue) ──
export type PublicPackageIncentive = { id: string; name: string; price_snapshot: string | number };
export type PublicPackageRoom = {
  id: string;
  room_number: string;
  capacity: number;
  status: "available" | "occupied" | "maintenance" | "reserved";
  current_occupancy: number;
  block?: { id: string; name: string } | null;
  roomType?: { id: string; name: string } | null;
  images?: { id: string; image_url: string; caption?: string }[];
};
export type PublicPackage = {
  id: string;
  name: string;
  description?: string | null;
  base_price_snapshot: string | number;
  total_price: string | number;
  is_published: boolean;
  created_at?: string;
  room?: PublicPackageRoom | null;
  incentives?: PublicPackageIncentive[];
};

export const publicApi = {
  roomTypes: () =>
    http
      .get<{ roomTypes: PublicRoomType[] }>("/public/room-types", { auth: false })
      .then((d) => d.roomTypes ?? []),
  overview: () => http.get<PublicOverview>("/public/overview", { auth: false }),
  // Fetch all published packages (small catalogue — filtering happens client-side).
  packages: () =>
    http
      .get<{ packages: PublicPackage[] } | PublicPackage[]>(
        "/public/packages?limit=100&sortBy=total_price&order=ASC",
        { auth: false },
      )
      .then((d) => (Array.isArray(d) ? d : d.packages ?? [])),
  packageById: (id: string) =>
    http
      .get<{ package?: PublicPackage } | PublicPackage>(`/public/packages/${id}`, { auth: false })
      .then((d) => (d && "package" in d ? d.package ?? null : (d as PublicPackage))),
};

export function usePublicRoomTypes() {
  const q = useAsync(() => publicApi.roomTypes(), []);
  return { roomTypes: q.data ?? [], loading: q.loading, error: q.error };
}

// ── Rooms are the bookable unit ──
export type PublicRoom = {
  id: string;
  room_number: string;
  status: "available" | "occupied" | "maintenance" | "reserved";
  capacity: number;
  current_occupancy: number;
  base_price: string | number;
  total_price: string | number;
  amenities?: PublicAmenity[];
  images?: { id: string; image_url: string; caption?: string }[];
  block?: { id: string; name: string } | null;
  floor?: { id: string; floor_number: number } | null;
  roomType?: { id: string; name: string } | null;
  available: boolean;
};

const roomsApi = {
  rooms: () =>
    http
      .get<{ rooms: PublicRoom[] } | PublicRoom[]>("/public/rooms", { auth: false })
      .then((d) => (Array.isArray(d) ? d : d.rooms ?? [])),
  roomById: (id: string) =>
    http
      .get<{ room?: PublicRoom } | PublicRoom>(`/public/rooms/${id}`, { auth: false })
      .then((d) => (d && "room" in d ? d.room ?? null : (d as PublicRoom))),
};

export function usePublicRooms() {
  const q = useAsync(() => roomsApi.rooms(), []);
  return { rooms: q.data ?? [], loading: q.loading, error: q.error };
}

export function usePublicRoom(id: string | null) {
  const q = useAsync(() => (id ? roomsApi.roomById(id) : Promise.resolve(null)), [id ?? ""], { enabled: !!id });
  return { room: q.data ?? null, loading: q.loading, error: q.error };
}

export function usePublicPackages() {
  const q = useAsync(() => publicApi.packages(), []);
  return { packages: q.data ?? [], loading: q.loading, error: q.error };
}

export function usePublicPackage(id: string | null) {
  const q = useAsync(() => (id ? publicApi.packageById(id) : Promise.resolve(null)), [id ?? ""], {
    enabled: !!id,
  });
  return { pkg: q.data ?? null, loading: q.loading, error: q.error };
}

export function usePublicOverview() {
  const q = useAsync(() => publicApi.overview(), []);
  return { overview: q.data, loading: q.loading };
}
