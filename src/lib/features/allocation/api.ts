import { http, unwrapList } from "@/lib/http";
import type { Allocation, AllocationRequest, RoomTransfer } from "./types";

type AllocateInput = {
  student_id: string;
  room_id: string;
  academic_year: string;
  semester: string;
  bed_number?: number;
};

export const allocationApi = {
  myAllocation: () =>
    http
      .get<{ allocation?: Allocation } | Allocation | null>("/allocations/my")
      .then((d) => (d && "allocation" in d ? d.allocation ?? null : (d as Allocation | null))),

  listRequests: (params: { status?: string } = {}) => {
    const p = new URLSearchParams();
    if (params.status) p.set("status", params.status);
    p.set("limit", "100");
    return http.get<unknown>(`/allocations/requests?${p}`).then((d) => unwrapList<AllocationRequest>(d, "requests"));
  },
  reviewRequest: (id: string, status: "approved" | "rejected", admin_remarks?: string) =>
    http.patch<AllocationRequest>(`/allocations/requests/${id}/review`, { status, admin_remarks }),
  createRequest: (body: Record<string, unknown>) => http.post<AllocationRequest>("/allocations/requests", body),

  listAllocations: (params: { status?: string } = {}) => {
    const p = new URLSearchParams();
    if (params.status) p.set("status", params.status);
    p.set("limit", "100");
    return http.get<unknown>(`/allocations?${p}`).then((d) => unwrapList<Allocation>(d, "allocations"));
  },
  allocate: (body: AllocateInput) => http.post<Allocation>("/allocations", body),
  // spec 002: admin/warden reserves the room a user already selected at signup.
  reserve: (body: { user_id: string }) =>
    http.post<ReservationResult>("/allocations/reserve", body),
  dashboard: () => http.get<Record<string, unknown>>("/allocations/dashboard"),
};

export type ReservationResult = {
  reserved: boolean;
  allocation_id?: string;
  payment_id?: string;
  amount_due?: number;
  reason?: string;
};

type CreateTransferInput = {
  reason: string;
  to_room_id?: string;
  preferred_room_type_id?: string;
};

export const transfersApi = {
  // Student: my transfer requests.
  listMine: () =>
    http.get<unknown>("/allocations/transfers/my?limit=100").then((d) => unwrapList<RoomTransfer>(d, "transfers")),

  // Admin/warden: full transfer queue.
  listAll: (params: { status?: string } = {}) => {
    const p = new URLSearchParams();
    if (params.status) p.set("status", params.status);
    p.set("limit", "100");
    return http.get<unknown>(`/allocations/transfers?${p}`).then((d) => unwrapList<RoomTransfer>(d, "transfers"));
  },

  getById: (id: string) =>
    http
      .get<{ transfer?: RoomTransfer } | RoomTransfer>(`/allocations/transfers/${id}`)
      .then((d) => (d && "transfer" in d ? (d.transfer as RoomTransfer) : (d as RoomTransfer))),

  // Student: request a transfer.
  create: (body: CreateTransferInput) => http.post<RoomTransfer>("/allocations/transfers", body),

  // Admin/warden: approve or reject a pending request.
  review: (id: string, status: "approved" | "rejected", admin_remarks?: string) =>
    http.patch<RoomTransfer>(`/allocations/transfers/${id}/review`, { status, admin_remarks }),

  // Student or admin: cancel a pending request.
  cancel: (id: string) => http.patch<RoomTransfer>(`/allocations/transfers/${id}/cancel`),

  // Admin/warden: finalize an approved transfer (executes the move).
  complete: (id: string) => http.post<RoomTransfer>(`/allocations/transfers/${id}/complete`),
};
