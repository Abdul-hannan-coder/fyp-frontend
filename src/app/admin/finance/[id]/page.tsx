"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Check, Eye, Mail, Phone, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  DetailBackLink,
  InfoCard,
  InfoGrid,
  DetailSkeleton,
  type InfoItem,
} from "@/components/dashboard/detail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAsync } from "@/lib/useAsync";
import { usePayment, usePaymentProofs } from "@/lib/features/fees/useFees";
import { refundsApi } from "@/lib/features/fees/api";
import { studentsApi } from "@/lib/features/students";

const date = (v?: string | null) => (v ? String(v).slice(0, 10) : "—");
const money = (v?: string | number | null) => (v == null ? "—" : `₨ ${Number(v).toLocaleString()}`);

export default function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const { payment, loading } = usePayment(id);

  const studentId = payment?.student_id;
  const studentQ = useAsync(() => studentsApi.getById(studentId!), [studentId], {
    key: `students:${studentId}`,
    enabled: !!studentId,
  });
  const refundsQ = useAsync(() => refundsApi.list({ student_id: studentId }), [studentId], {
    key: studentId ? `refunds:student:${studentId}` : undefined,
    enabled: !!studentId,
  });

  if (loading && !payment) return <DetailSkeleton sections={4} />;
  if (!payment) {
    return (
      <>
        <DetailBackLink href="/admin/finance" label="Back to finance" />
        <p className="py-20 text-center text-sm text-muted-foreground">Payment not found.</p>
      </>
    );
  }

  const student = studentQ.data;
  const name = student?.user?.full_name ?? payment.student?.user?.full_name ?? "Resident";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const refunds = (refundsQ.data ?? []).filter((r) => r.payment_id === payment.id);
  const fs = payment.feeStructure;

  const paymentInfo: InfoItem[] = [
    { label: "Status", value: <StatusBadge status={payment.status} /> },
    { label: "Amount due", value: money(payment.amount_due) },
    { label: "Amount paid", value: money(payment.amount_paid) },
    { label: "Total amount", value: money(payment.total_amount) },
    { label: "Late fee", value: money(payment.late_fee) },
    { label: "Due date", value: date(payment.due_date) },
    { label: "Method", value: payment.payment_method ?? "—" },
    { label: "Txn reference", value: payment.transaction_reference ?? "—" },
    { label: "Receipt #", value: payment.receipt_number ?? "—" },
    { label: "Verified by", value: payment.verifier?.full_name ?? payment.verifier?.email ?? "—" },
    { label: "Verified at", value: date(payment.verified_at) },
  ];

  const feeInfo: InfoItem[] = [
    { label: "Name", value: fs?.name ?? "—" },
    { label: "Type", value: fs?.fee_type ? fs.fee_type.replace(/_/g, " ") : "—" },
    { label: "Amount", value: money(fs?.amount) },
    { label: "Academic year", value: fs?.academic_year ?? "—" },
    { label: "Semester", value: fs?.semester ?? "—" },
    { label: "Mandatory", value: fs?.is_mandatory == null ? "—" : fs.is_mandatory ? "Yes" : "No" },
  ];

  const studentInfo: InfoItem[] = [
    { label: "Student ID", value: student?.student_id ?? payment.student?.student_id ?? "—" },
    { label: "Department", value: student?.department ?? payment.student?.department ?? "—" },
    { label: "Year", value: student?.year_of_study ? `Year ${student.year_of_study}` : "—" },
    { label: "Gender", value: student?.gender ?? "—" },
    { label: "Date of birth", value: date(student?.date_of_birth) },
    { label: "Blood group", value: student?.blood_group ?? "—" },
    { label: "Guardian", value: student?.guardian_name ?? "—" },
    { label: "Guardian phone", value: student?.guardian_phone ?? "—" },
    { label: "Address", value: student?.address ?? "—" },
  ];

  return (
    <>
      <DetailBackLink href="/admin/finance" label="Back to finance" />
      <PageHeader title={name} description="Payment detail — resident, fee, proofs and refunds." />

      <div className="mx-auto w-full max-w-5xl space-y-4">
        <InfoCard title="Resident">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <Avatar className="size-20 shrink-0">
              {student?.profile_image_url && <AvatarImage src={student.profile_image_url} alt={name} />}
              <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground">{student?.student_id ?? payment.student?.student_id ?? "Resident"}</p>
            </div>
            <div className="space-y-2 text-sm sm:ml-auto sm:text-left">
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><Mail className="size-4 shrink-0" /> {student?.user?.email ?? payment.student?.user?.email ?? "—"}</p>
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><Phone className="size-4 shrink-0" /> {student?.user?.phone ?? "—"}</p>
            </div>
          </div>
        </InfoCard>

        <InfoCard title="Payment">
          <InfoGrid items={paymentInfo} />
        </InfoCard>

        <InfoCard title="Fee structure">
          <InfoGrid items={feeInfo} />
        </InfoCard>

        <InfoCard title="Student profile" description="Information on file with administration">
          <InfoGrid items={studentInfo} />
        </InfoCard>

        <PaymentProofs paymentId={payment.id} />

        <InfoCard title="Refunds" description="Refunds raised against this payment">
          {refundsQ.loading && refunds.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : refunds.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No refunds for this payment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{money(r.amount)}</TableCell>
                    <TableCell className="max-w-[18rem] truncate text-muted-foreground" title={r.reason}>{r.reason}</TableCell>
                    <TableCell className="text-muted-foreground">{date(r.created_at)}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={r.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </InfoCard>
      </div>
    </>
  );
}

// Uploaded payment proofs for this payment, with admin verify/reject actions.
function PaymentProofs({ paymentId }: { paymentId: string }) {
  const { proofs, loading, busyId, verify, reject } = usePaymentProofs(paymentId);
  const [rejectId, setRejectId] = React.useState<string | null>(null);

  return (
    <InfoCard title="Payment proofs" description="Uploaded transaction proofs — verify or reject each">
      {loading && proofs.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
      ) : proofs.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No proof uploaded for this payment yet.</p>
      ) : (
        <div className="space-y-3">
          {proofs.map((pf) => (
            <div key={pf.id} className="rounded-xl border border-border/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize">{pf.proof_type?.replace(/_/g, " ") ?? "Proof"}</p>
                  {pf.transaction_id && <p className="truncate text-xs text-muted-foreground">Txn: {pf.transaction_id}</p>}
                  {pf.file_name && <p className="truncate text-xs text-muted-foreground">{pf.file_name}</p>}
                  {pf.remarks && <p className="text-xs text-muted-foreground">{pf.remarks}</p>}
                </div>
                <StatusBadge status={pf.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {pf.proof_url && (
                  <Button variant="outline" size="sm" onClick={() => window.open(pf.proof_url as string, "_blank", "noopener,noreferrer")}>
                    <Eye className="size-4" /> Open file
                  </Button>
                )}
                {pf.status === "pending" && (
                  <>
                    <Button variant="outline" size="sm" className="text-destructive" disabled={busyId === pf.id} onClick={() => setRejectId(pf.id)}>
                      <X className="size-4" /> Reject
                    </Button>
                    <Button size="sm" disabled={busyId === pf.id} onClick={() => { verify(pf.id); }}>
                      <Check className="size-4" /> Verify
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <RejectProofDialog
        open={!!rejectId}
        busy={!!rejectId && busyId === rejectId}
        onOpenChange={(o) => !o && setRejectId(null)}
        onConfirm={async (remarks) => {
          if (!rejectId) return;
          const ok = await reject(rejectId, remarks);
          if (ok) setRejectId(null);
        }}
      />
    </InfoCard>
  );
}

function RejectProofDialog({
  open,
  busy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (remarks: string) => void | Promise<void>;
}) {
  const [remarks, setRemarks] = React.useState("");
  React.useEffect(() => {
    if (open) setRemarks("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject payment proof</DialogTitle>
          <DialogDescription>Give the resident a reason for rejecting this proof.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="reject-remarks">Reason</Label>
          <Textarea
            id="reject-remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. The transaction reference does not match our records."
          />
        </div>
        <DialogFooter showCloseButton>
          <Button variant="destructive" disabled={!remarks.trim() || busy} onClick={() => onConfirm(remarks.trim())}>
            Reject proof
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
