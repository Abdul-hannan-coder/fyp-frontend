"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SimpleSelect from "@/components/ui/simple-select";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { usePayments, useRefunds } from "@/lib/features/fees/useFees";
import type { Payment, Refund } from "@/lib/features/fees/types";

const money = (v: string | number) => `₨ ${Number(v).toLocaleString()}`;
const studentName = (r: Refund) => r.student?.user?.full_name ?? r.student?.user?.email ?? "—";

export default function AdminRefunds() {
  const router = useRouter();
  const rf = useRefunds();
  const { refunds, loading, error } = rf;
  const [reviewTarget, setReviewTarget] = React.useState<{ refund: Refund; action: "approved" | "rejected" } | null>(null);

  const pending = refunds.filter((r) => r.status === "pending").length;
  const approved = refunds.filter((r) => r.status === "approved").length;
  const processed = refunds.filter((r) => r.status === "processed").length;
  const totalApprovedAmount = refunds
    .filter((r) => r.status === "approved" || r.status === "processed")
    .reduce((s, r) => s + Number(r.amount), 0);

  return (
    <>
      <PageHeader title="Refunds" description="Issue, review and process student refund requests.">
        <NewRefundDialog submitting={rf.submitting} onSubmit={rf.create} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Pending" value={String(pending)} trend="flat" hint="awaiting review" />
        <StatCard label="Approved" value={String(approved)} hint="to be processed" />
        <StatCard label="Processed" value={String(processed)} trend="up" hint="completed" />
        <StatCard label="Approved value" value={money(totalApprovedAmount)} hint="approved + processed" />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Refund requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonTable cols={6} />
          ) : refunds.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No refund requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((r) => {
                  const busy = rf.busyId === r.id;
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/refunds/${r.id}`)}
                    >
                      <TableCell className="font-medium">{studentName(r)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.payment?.receipt_number ?? "—"}</TableCell>
                      <TableCell>{money(r.amount)}</TableCell>
                      <TableCell className="max-w-[18rem] truncate text-muted-foreground" title={r.reason}>{r.reason}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {r.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" disabled={busy} onClick={() => setReviewTarget({ refund: r, action: "approved" })}>
                                <Check className="size-4" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" disabled={busy} onClick={() => setReviewTarget({ refund: r, action: "rejected" })}>
                                <X className="size-4" /> Reject
                              </Button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => {
                                if (window.confirm(`Mark refund of ${money(r.amount)} as processed? The payment will be marked refunded.`)) {
                                  rf.process(r.id);
                                }
                              }}
                            >
                              Mark processed
                            </Button>
                          )}
                          {(r.status === "processed" || r.status === "rejected") && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReviewDialog
        target={reviewTarget}
        onClose={() => setReviewTarget(null)}
        busy={!!reviewTarget && rf.busyId === reviewTarget.refund.id}
        onConfirm={async (remarks) => {
          if (!reviewTarget) return;
          const ok = await rf.review(reviewTarget.refund.id, reviewTarget.action, remarks || undefined);
          if (ok) setReviewTarget(null);
        }}
      />
    </>
  );
}

function NewRefundDialog({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (input: { payment_id: string; student_id: string; amount: number; reason: string }) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const payq = usePayments({ status: "paid" });
  const [paymentId, setPaymentId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");

  // Only payments with money actually received can be refunded.
  const refundable = React.useMemo(
    () => payq.payments.filter((p) => Number(p.amount_paid) > 0),
    [payq.payments],
  );

  const selected = refundable.find((p) => p.id === paymentId);
  const maxAmount = selected ? Number(selected.amount_paid) : 0;

  React.useEffect(() => {
    if (open && !paymentId && refundable[0]) setPaymentId(refundable[0].id);
  }, [open, refundable, paymentId]);

  // Default the amount to the payment's full paid value when a payment is picked.
  React.useEffect(() => {
    if (selected) setAmount(selected.amount_paid);
  }, [selected]);

  const paymentLabel = (p: Payment) => {
    const who = p.student?.user?.full_name ?? p.student?.user?.email ?? p.student_id;
    return `${who} · ${p.feeStructure?.name ?? "Hostel fee"} · paid ${money(p.amount_paid)}${p.receipt_number ? ` · ${p.receipt_number}` : ""}`;
  };

  const submit = async () => {
    if (!selected) return;
    const ok = await onSubmit({
      payment_id: selected.id,
      student_id: selected.student_id,
      amount: Number(amount),
      reason: reason.trim(),
    });
    if (ok) {
      setPaymentId("");
      setAmount("");
      setReason("");
      setOpen(false);
    }
  };

  const amountNum = Number(amount);
  const invalid = !selected || !reason.trim() || !amountNum || amountNum <= 0 || amountNum > maxAmount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <RotateCcw className="size-4" /> New refund
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue a refund</DialogTitle>
          <DialogDescription>Pick a paid payment, then set the amount and reason.</DialogDescription>
        </DialogHeader>
        {payq.loading ? (
          <div className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : refundable.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No paid payments are eligible for a refund.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Payment</Label>
              <SimpleSelect
                value={paymentId}
                onChange={setPaymentId}
                className="w-full"
                options={refundable.map((p) => ({ value: p.id, label: paymentLabel(p) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="refund-amount">Amount (max {money(maxAmount)})</Label>
              <Input
                id="refund-amount"
                type="number"
                min="0.01"
                max={maxAmount}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="refund-reason">Reason</Label>
              <Textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Early checkout — security deposit refund"
              />
            </div>
          </div>
        )}
        <DialogFooter showCloseButton>
          <Button disabled={invalid || submitting} onClick={submit}>
            Create refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({
  target,
  onClose,
  busy,
  onConfirm,
}: {
  target: { refund: Refund; action: "approved" | "rejected" } | null;
  onClose: () => void;
  busy: boolean;
  onConfirm: (remarks: string) => Promise<void>;
}) {
  const [remarks, setRemarks] = React.useState("");
  React.useEffect(() => { if (target) setRemarks(""); }, [target]);

  const approving = target?.action === "approved";

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      {target && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="size-4" /> {approving ? "Approve" : "Reject"} refund
            </DialogTitle>
            <DialogDescription>
              {studentName(target.refund)} · {money(target.refund.amount)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="review-remarks">Remarks {approving ? "(optional)" : "(reason for rejection)"}</Label>
            <Textarea
              id="review-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={approving ? "e.g. Approved per policy" : "e.g. Refund not eligible"}
            />
          </div>
          <DialogFooter showCloseButton>
            <Button disabled={busy} onClick={() => onConfirm(remarks)}>
              {approving ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
