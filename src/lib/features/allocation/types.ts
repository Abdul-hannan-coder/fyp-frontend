export type AllocationStatus =
  | "pending_payment"
  | "active"
  | "checked_out"
  | "cancelled"
  | "transferred";

export type Allocation = {
  id: string;
  student_id: string;
  room_id: string;
  bed_number?: number | null;
  academic_year: string;
  semester: string;
  status: AllocationStatus;
  check_in_date?: string | null;
  room?: {
    id: string;
    room_number: string;
    capacity?: number;
    roomType?: { name: string };
    block?: { id: string; name: string };
  };
  student?: { id: string; student_id?: string; user?: { full_name: string } };
};

export type AllocationRequest = {
  id: string;
  student_id: string;
  academic_year: string;
  semester: string;
  status: "pending" | "approved" | "rejected" | "allocated" | "cancelled";
  priority?: number;
  reason?: string;
  preferredRoomType?: { id: string; name: string };
  preferredBlock?: { id: string; name: string };
  student?: { id: string; student_id?: string; user?: { full_name: string } };
  createdAt?: string;
};

export type TransferStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export type RoomTransfer = {
  id: string;
  student_id: string;
  current_allocation_id: string;
  from_room_id: string;
  to_room_id?: string | null;
  preferred_room_type_id?: string | null;
  reason: string;
  status: TransferStatus;
  admin_remarks?: string | null;
  reviewed_at?: string | null;
  transfer_date?: string | null;
  created_at?: string;
  fromRoom?: { id: string; room_number: string };
  toRoom?: { id: string; room_number: string } | null;
  preferredRoomType?: { id: string; name: string } | null;
  student?: {
    id: string;
    student_id?: string;
    user?: { full_name?: string; email?: string };
  };
};
