"use client";

import * as React from "react";
import { toast } from "sonner";
import { http, unwrapList } from "@/lib/http";
import { useAsync } from "@/lib/useAsync";
import type { Amenity } from "@/lib/features/amenities";

export type Block = {
  id: string;
  name: string;
  total_floors?: number;
  description?: string;
  gender?: "boys" | "girls" | "mixed";
  location?: string | null;
  is_active?: boolean;
};
export type Floor = {
  id: string;
  block_id: string;
  floor_number: number;
  block?: { name: string };
};
export type RoomTypeImage = { id: string; image_url: string; is_primary?: boolean };
export type RoomType = {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  base_price: string;
  bed_type?: string | null;
  size_sqft?: number | null;
  amenities?: Amenity[];
  amenities_price?: number;
  total_price?: number;
  images?: RoomTypeImage[];
};
export type Room = {
  id: string;
  room_number: string;
  status: "available" | "occupied" | "maintenance" | "reserved";
  capacity?: number;
  base_price?: string;
  current_occupancy?: number;
  has_custom_amenities?: boolean;
  notes?: string | null;
  block_id?: string;
  floor_id?: string;
  amenities?: Amenity[];
  effective_amenities?: Amenity[];
  amenities_price?: number;
  total_price?: number;
  block?: { id?: string; name: string };
  floor?: { id?: string; floor_number: number; block?: { name: string } };
  roomType?: { id?: string; name: string; capacity: number; base_price?: string; amenities?: Amenity[] };
  images?: RoomTypeImage[];
};

type CreateBlockInput = { name: string; total_floors: number; description?: string; gender?: string; location?: string };
type CreateRoomTypeInput = { name: string; capacity: number; base_price: number; bed_type?: string; size_sqft?: number; amenity_ids?: string[] };
// A room owns capacity + base_price; floor and room type are optional labels.
type CreateRoomInput = { room_number: string; floor_id?: string; room_type_id?: string; capacity: number; base_price: number; status?: string; amenity_ids?: string[] };

// Defensive unwrap for get-by-id / mutation responses returning { key } or bare entity.
function unwrap<T>(d: unknown, key: string): T {
  if (d && typeof d === "object" && key in (d as Record<string, unknown>)) {
    return (d as Record<string, T>)[key];
  }
  return d as T;
}

// ── Room inspections ──
export type RoomInspection = {
  id: string;
  room_id: string;
  inspected_by?: string | null;
  inspected_at?: string;
  condition_rating?: number;
  condition_notes?: string | null;
  maintenance_required?: boolean;
  created_at?: string;
  inspector?: { id?: string; full_name?: string; email?: string };
};

export type InspectionInput = {
  condition_rating: number;
  inspected_at?: string;
  condition_notes?: string;
  maintenance_required?: boolean;
};

export const roomsApi = {
  blocks: () => http.get<unknown>("/rooms/blocks?limit=100").then((d) => unwrapList<Block>(d, "blocks")),
  floors: () => http.get<unknown>("/rooms/floors?limit=200").then((d) => unwrapList<Floor>(d, "floors")),
  roomTypes: () => http.get<unknown>("/rooms/room-types?limit=100").then((d) => unwrapList<RoomType>(d, "roomTypes")),
  rooms: () => http.get<unknown>("/rooms?limit=200").then((d) => unwrapList<Room>(d, "rooms")),
  available: () => http.get<unknown>("/rooms/available?limit=200").then((d) => unwrapList<Room>(d, "rooms")),
  updateStatus: (id: string, status: string) => http.patch<Room>(`/rooms/${id}/status`, { status }),

  createBlock: (body: CreateBlockInput) => http.post<Block>("/rooms/blocks", body),
  updateBlock: (id: string, body: Partial<CreateBlockInput>) => http.put<Block>(`/rooms/blocks/${id}`, body),
  deleteBlock: (id: string) => http.del<null>(`/rooms/blocks/${id}`),
  createFloor: (body: { block_id: string; floor_number: number; total_rooms?: number }) =>
    http.post<Floor>("/rooms/floors", body),
  updateFloor: (id: string, body: { block_id?: string; floor_number?: number; total_rooms?: number; description?: string }) =>
    http.put<Floor>(`/rooms/floors/${id}`, body),
  deleteFloor: (id: string) => http.del<null>(`/rooms/floors/${id}`),
  createRoomType: (body: CreateRoomTypeInput) => http.post<RoomType>("/rooms/room-types", body),
  updateRoomType: (id: string, body: Partial<CreateRoomTypeInput>) => http.put<RoomType>(`/rooms/room-types/${id}`, body),
  deleteRoomType: (id: string) => http.del<null>(`/rooms/room-types/${id}`),
  createRoom: (body: CreateRoomInput) => http.post<Room>("/rooms", body),
  updateRoom: (id: string, body: Partial<CreateRoomInput> & { notes?: string; is_active?: boolean }) =>
    http.put<Room>(`/rooms/${id}`, body),
  deleteRoom: (id: string) => http.del<null>(`/rooms/${id}`),

  images: (roomId: string) =>
    http.get<unknown>(`/rooms/${roomId}/images`).then((d) => unwrapList<RoomTypeImage>(d, "images")),
  uploadImages: (roomId: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    return http.post<unknown>(`/rooms/${roomId}/images`, form, { isForm: true });
  },
  deleteImage: (roomId: string, imageId: string) => http.del<null>(`/rooms/${roomId}/images/${imageId}`),
  setPrimaryImage: (roomId: string, imageId: string) => http.patch<null>(`/rooms/${roomId}/images/${imageId}/primary`),
  room: (id: string) =>
    http.get<{ room: Room } | Room>(`/rooms/${id}`).then((d) => (d && "room" in d ? d.room : (d as Room))),

  listInspections: (roomId: string) =>
    http
      .get<unknown>(`/rooms/${roomId}/inspections?limit=100`)
      .then((d) => unwrapList<RoomInspection>(d, "inspections")),
  createInspection: (roomId: string, body: InspectionInput) =>
    http
      .post<unknown>(`/rooms/${roomId}/inspections`, body)
      .then((d) => unwrap<RoomInspection>(d, "inspection")),
};

export function useRoomsAdmin() {
  const blocksQ = useAsync(() => roomsApi.blocks(), []);
  const floorsQ = useAsync(() => roomsApi.floors(), []);
  const typesQ = useAsync(() => roomsApi.roomTypes(), []);
  const roomsQ = useAsync(() => roomsApi.rooms(), []);
  const [busy, setBusy] = React.useState(false);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await Promise.all([blocksQ.refetch(), floorsQ.refetch(), typesQ.refetch(), roomsQ.refetch()]);
      return true;
    } catch (err) {
      const e = err as { message: string; errors?: { message: string }[] };
      toast.error(e.errors?.[0]?.message || e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    blocks: blocksQ.data ?? [],
    floors: floorsQ.data ?? [],
    roomTypes: typesQ.data ?? [],
    rooms: roomsQ.data ?? [],
    loading: blocksQ.loading || typesQ.loading,
    busy,
    refetch: () => Promise.all([blocksQ.refetch(), floorsQ.refetch(), typesQ.refetch(), roomsQ.refetch()]),
    createBlock: (b: CreateBlockInput) => run(() => roomsApi.createBlock(b), "Block created"),
    updateBlock: (id: string, b: Partial<CreateBlockInput>) => run(() => roomsApi.updateBlock(id, b), "Block updated"),
    deleteBlock: (id: string) => run(() => roomsApi.deleteBlock(id), "Block deleted"),
    createFloor: (b: { block_id: string; floor_number: number; total_rooms?: number }) =>
      run(() => roomsApi.createFloor(b), "Floor created"),
    updateFloor: (id: string, b: { block_id?: string; floor_number?: number; description?: string }) =>
      run(() => roomsApi.updateFloor(id, b), "Floor updated"),
    deleteFloor: (id: string) => run(() => roomsApi.deleteFloor(id), "Floor deleted"),
    createRoomType: (b: CreateRoomTypeInput) => run(() => roomsApi.createRoomType(b), "Room type created"),
    updateRoomType: (id: string, b: Partial<CreateRoomTypeInput>) => run(() => roomsApi.updateRoomType(id, b), "Room type updated"),
    deleteRoomType: (id: string) => run(() => roomsApi.deleteRoomType(id), "Room type deleted"),
    createRoom: (b: CreateRoomInput) => run(() => roomsApi.createRoom(b), "Room created"),
    updateRoom: (id: string, b: Partial<CreateRoomInput> & { notes?: string }) => run(() => roomsApi.updateRoom(id, b), "Room updated"),
    deleteRoom: (id: string) => run(() => roomsApi.deleteRoom(id), "Room deleted"),
  };
}

export function useRooms() {
  const q = useAsync(() => roomsApi.rooms(), []);
  const [busy, setBusy] = React.useState<string | null>(null);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      await roomsApi.updateStatus(id, status);
      toast.success(`Room marked ${status}`);
      await q.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return { rooms: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch, busyId: busy, setStatus };
}

// ── Packages (room + priced incentives, with snapshotted total) ──
export type PackageIncentive = Amenity & { PackageIncentive?: { price_snapshot?: string | number } };
export type RoomPackage = {
  id: string;
  name: string;
  description?: string | null;
  room_id: string;
  base_price_snapshot?: string | number;
  total_price?: string | number;
  is_published?: boolean;
  created_at?: string;
  room?: { id?: string; room_number?: string; base_price?: string; block?: { id?: string; name?: string } };
  incentives?: PackageIncentive[];
};

export type PackageInput = {
  name: string;
  room_id: string;
  description?: string;
  incentive_ids?: string[];
  is_published?: boolean;
};

export const packagesApi = {
  list: () =>
    http.get<unknown>("/rooms/packages?limit=200").then((d) => unwrapList<RoomPackage>(d, "packages")),
  get: (id: string) =>
    http.get<unknown>(`/rooms/packages/${id}`).then((d) => unwrap<RoomPackage>(d, "package")),
  create: (body: PackageInput) =>
    http.post<unknown>("/rooms/packages", body).then((d) => unwrap<RoomPackage>(d, "package")),
  update: (id: string, body: Partial<PackageInput>) =>
    http.put<unknown>(`/rooms/packages/${id}`, body).then((d) => unwrap<RoomPackage>(d, "package")),
  publish: (id: string, is_published: boolean) =>
    http
      .patch<unknown>(`/rooms/packages/${id}/publish`, { is_published })
      .then((d) => unwrap<RoomPackage>(d, "package")),
  remove: (id: string) => http.del<null>(`/rooms/packages/${id}`),
};

export function usePackages() {
  const q = useAsync(() => packagesApi.list(), []);
  const [busy, setBusy] = React.useState(false);

  const wrap = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await q.refetch();
      return true;
    } catch (err) {
      const e = err as { message: string; errors?: { message: string }[] };
      toast.error(e.errors?.[0]?.message || e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    packages: q.data ?? [],
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    busy,
    create: (b: PackageInput) => wrap(() => packagesApi.create(b), "Package created"),
    update: (id: string, b: Partial<PackageInput>) => wrap(() => packagesApi.update(id, b), "Package updated"),
    publish: (id: string, is_published: boolean) =>
      wrap(() => packagesApi.publish(id, is_published), is_published ? "Package published" : "Package unpublished"),
    remove: (id: string) => wrap(() => packagesApi.remove(id), "Package deleted"),
  };
}

// ── Dashboard & hierarchy ──
// GET /rooms/dashboard -> { dashboard: { summary, status_breakdown, rooms_per_block, rooms_per_type } }
export type RoomDashboard = {
  summary: {
    total_rooms: number;
    total_capacity: number;
    total_occupancy: number;
    occupancy_rate: string | number;
  };
  status_breakdown: Partial<Record<Room["status"], number>>;
  rooms_per_block: { id: string; name: string; room_count: string | number }[];
  rooms_per_type: { id: string; name: string; capacity: number; room_count: string | number }[];
};

// GET /rooms/hierarchy -> { hierarchy: Block[] } where each block has floors -> rooms.
export type HierarchyRoom = Room & {
  roomType?: { id?: string; name: string; capacity: number; base_price?: string; amenities?: Amenity[] };
  images?: RoomTypeImage[];
};
export type HierarchyFloor = Floor & { rooms?: HierarchyRoom[] };
export type HierarchyBlock = Block & { floors?: HierarchyFloor[] };

export const roomsDashboardApi = {
  dashboard: () =>
    http.get<unknown>("/rooms/dashboard").then((d) => unwrap<RoomDashboard>(d, "dashboard")),
  hierarchy: () =>
    http.get<unknown>("/rooms/hierarchy").then((d) => unwrapList<HierarchyBlock>(d, "hierarchy")),
};

export function useRoomsDashboard() {
  const q = useAsync(() => roomsDashboardApi.dashboard(), []);
  return { dashboard: q.data, loading: q.loading, error: q.error, refetch: q.refetch };
}

export function useRoomsHierarchy() {
  const q = useAsync(() => roomsDashboardApi.hierarchy(), []);
  return { hierarchy: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch };
}

export function useInspections(roomId: string) {
  const q = useAsync(() => roomsApi.listInspections(roomId), [roomId]);
  const [busy, setBusy] = React.useState(false);

  const create = async (b: InspectionInput) => {
    setBusy(true);
    try {
      await roomsApi.createInspection(roomId, b);
      toast.success("Inspection logged");
      await q.refetch();
      return true;
    } catch (err) {
      const e = err as { message: string; errors?: { message: string }[] };
      toast.error(e.errors?.[0]?.message || e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { inspections: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch, busy, create };
}
