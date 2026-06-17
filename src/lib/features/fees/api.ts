import { http, unwrapList, API_URL, tokenStore } from "@/lib/http";
import type {
  CreateRefundInput,
  FeeStructure,
  Payment,
  PaymentProof,
  PaymentSummary,
  RecordPaymentInput,
  Refund,
} from "./types";

const unwrapProof = (d: unknown): PaymentProof => {
  if (d && typeof d === "object" && "proof" in d) {
    return (d as { proof: PaymentProof }).proof;
  }
  return d as PaymentProof;
};

export const feesApi = {
  listPayments: (params: { student_id?: string; status?: string } = {}) => {
    const p = new URLSearchParams();
    if (params.student_id) p.set("student_id", params.student_id);
    if (params.status) p.set("status", params.status);
    p.set("limit", "100");
    return http.get<unknown>(`/fees/payments?${p}`).then((d) => unwrapList<Payment>(d, "payments"));
  },
  myPayments: () => http.get<unknown>("/fees/payments/my").then((d) => unwrapList<Payment>(d, "payments")),
  getPayment: (id: string) => http.get<{ payment: Payment }>(`/fees/payments/${id}`).then((d) => d.payment ?? (d as unknown as Payment)),
  recordPayment: (input: RecordPaymentInput) => http.post<Payment>("/fees/payments", input),
  verifyPayment: (id: string, status: "paid" | "rejected", remarks?: string) =>
    http.patch<Payment>(`/fees/payments/${id}/verify`, { status, remarks }),
  uploadProof: (paymentId: string, form: FormData) =>
    http.post<unknown>(`/fees/payments/${paymentId}/proof`, form, { isForm: true }),
  listProofs: (paymentId: string) =>
    http
      .get<unknown>(`/fees/payments/${paymentId}/proofs`)
      .then((d) => unwrapList<PaymentProof>(d, "proofs")),
  // Per-student summary (GET /fees/payments/summary is student-scoped, authorize('student')).
  paymentsSummary: () => http.get<PaymentSummary>("/fees/payments/summary"),
  // Admin utility: recompute late fees on overdue payments. Body is unused by the backend.
  calculateLateFees: () =>
    http.post<{ count: number }>("/fees/payments/calculate-late-fees", {}),
  // Approve a payment proof — applies the proof amount to its payment. remarks optional.
  verifyProof: (proofId: string, body: { remarks?: string } = {}) =>
    http.patch<unknown>(`/fees/payment-proofs/${proofId}/verify`, body).then(unwrapProof),
  // Reject a payment proof — remarks (reason) is required by the backend validator.
  rejectProof: (proofId: string, body: { remarks: string }) =>
    http.patch<unknown>(`/fees/payment-proofs/${proofId}/reject`, body).then(unwrapProof),
  listStructures: () =>
    http.get<unknown>("/fees/fee-structures?limit=100").then((d) => unwrapList<FeeStructure>(d, "feeStructures")),
  createStructure: (body: {
    name: string;
    fee_type: string;
    amount: number;
    academic_year: string;
    semester: string;
    room_type_id?: string;
    is_mandatory?: boolean;
  }) => http.post<FeeStructure>("/fees/fee-structures", body),
  dashboard: () => http.get<Record<string, unknown>>("/fees/dashboard"),
};

const unwrapRefund = (d: unknown): Refund => {
  if (d && typeof d === "object" && "refund" in d) {
    return (d as { refund: Refund }).refund;
  }
  return d as Refund;
};

export const refundsApi = {
  list: (params: { status?: string; student_id?: string } = {}) => {
    const p = new URLSearchParams();
    if (params.status) p.set("status", params.status);
    if (params.student_id) p.set("student_id", params.student_id);
    p.set("limit", "100");
    return http.get<unknown>(`/fees/refunds?${p}`).then((d) => unwrapList<Refund>(d, "refunds"));
  },
  myList: () =>
    http.get<unknown>("/fees/refunds/my?limit=100").then((d) => unwrapList<Refund>(d, "refunds")),
  get: (id: string) => http.get<unknown>(`/fees/refunds/${id}`).then(unwrapRefund),
  create: (input: CreateRefundInput) => http.post<unknown>("/fees/refunds", input).then(unwrapRefund),
  review: (id: string, status: "approved" | "rejected", remarks?: string) =>
    http.patch<unknown>(`/fees/refunds/${id}/review`, { status, remarks }).then(unwrapRefund),
  process: (id: string) => http.patch<unknown>(`/fees/refunds/${id}/process`).then(unwrapRefund),
};

// Binary download — the JSON-parsing `http` client can't be used for the PDF receipt.
export async function downloadPaymentReceipt(paymentId: string, receiptNumber?: string | null) {
  const res = await fetch(`${API_URL}/fees/payments/${paymentId}/receipt`, {
    headers: tokenStore.access ? { Authorization: `Bearer ${tokenStore.access}` } : {},
  });
  if (!res.ok) {
    let message = `Could not download receipt (${res.status})`;
    try {
      const json = (await res.json()) as { message?: string };
      if (json?.message) message = json.message;
    } catch {
      /* non-JSON body — keep default message */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${receiptNumber ?? paymentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type CreateFeeStructureInput = {
  name: string;
  fee_type: string;
  amount: number;
  academic_year: string;
  semester: string;
  room_type_id?: string;
  is_mandatory?: boolean;
};
