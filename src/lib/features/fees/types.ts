export type PaymentStatus = "pending" | "partial" | "paid" | "overdue" | "waived" | "refunded";

export type Payment = {
  id: string;
  student_id: string;
  allocation_id: string | null;
  fee_structure_id: string;
  amount_due: string;
  amount_paid: string;
  total_amount: string;
  late_fee?: string;
  due_date: string;
  payment_method?: string | null;
  transaction_reference?: string | null;
  receipt_number?: string | null;
  status: PaymentStatus;
  feeStructure?: { id: string; name: string; fee_type: string };
  student?: { id: string; student_id?: string; user?: { full_name: string; email: string } };
};

export type FeeStructure = {
  id: string;
  name: string;
  fee_type: string;
  amount: string;
  academic_year: string;
  semester?: string;
  due_date?: string;
  is_mandatory: boolean;
  is_active: boolean;
};

export type RecordPaymentInput = {
  payment_id: string;
  amount_paid: number;
  payment_method: string;
  transaction_reference?: string;
  remarks?: string;
};

export type PaymentProof = {
  id: string;
  payment_id: string;
  student_id: string;
  proof_type: string;
  transaction_id?: string | null;
  proof_url?: string | null;
  file_name?: string | null;
  status: "pending" | "verified" | "rejected";
  remarks?: string | null;
  created_at?: string;
};

export type RefundStatus = "pending" | "approved" | "processed" | "rejected";

export const REFUND_STATUSES: RefundStatus[] = ["pending", "approved", "processed", "rejected"];

export type Refund = {
  id: string;
  payment_id: string;
  student_id: string;
  amount: string;
  reason: string;
  status: RefundStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  processed_at?: string | null;
  transaction_reference?: string | null;
  remarks?: string | null;
  created_at?: string;
  payment?: { id: string; receipt_number?: string | null; amount_paid?: string };
  student?: { id: string; student_id?: string; user?: { full_name?: string; email?: string } };
  approver?: { id: string; email?: string; full_name?: string } | null;
};

export type CreateRefundInput = {
  payment_id: string;
  student_id: string;
  amount: number;
  reason: string;
};
