"use client";

import * as React from "react";
import { Download, Upload } from "lucide-react";
import { SkeletonTable } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { useMyPayments } from "@/lib/features/fees/useFees";
import type { Payment } from "@/lib/features/fees/types";

const money = (v: string | number) => `₨ ${Number(v).toLocaleString()}`;
const remaining = (p: Payment) => Number(p.total_amount) - Number(p.amount_paid);

export default function StudentFees() {
  const fees = useMyPayments();
  const { payments, loading, error } = fees;
  const [proofTarget, setProofTarget] = React.useState<Payment | null>(null);

  const outstanding = payments
    .filter((p) => p.status !== "paid" && p.status !== "waived")
    .reduce((s, p) => s + remaining(p), 0);
  const paid = payments.filter((p) => p.status === "paid").length;

  return (
    <>
      <PageHeader title="Fees & payments" description="Your dues, payments and receipts." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={money(outstanding)} trend="flat" hint={`${payments.length - paid} item(s) due`} />
        <StatCard label="Paid items" value={String(paid)} trend="up" hint="cleared" />
        <StatCard label="Total dues" value={String(payments.length)} hint="this account" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="py-8 text-center text-sm text-destructive">{error}</p>}
          {loading ? (
            <SkeletonTable cols={5} />
          ) : payments.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No payments yet. Dues appear here once your room is reserved.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const settled = p.status === "paid" || p.status === "waived";
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.feeStructure?.name ?? "Hostel fee"}</TableCell>
                      <TableCell>{money(p.total_amount)}</TableCell>
                      <TableCell className="text-muted-foreground">{String(p.due_date).slice(0, 10)}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!settled && (
                            <Button size="sm" onClick={() => setProofTarget(p)}>
                              <Upload className="size-4" /> Pay &amp; upload proof
                            </Button>
                          )}
                          {settled && p.receipt_number && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={fees.submitting}
                              onClick={() => fees.downloadReceipt(p.id, p.receipt_number)}
                            >
                              <Download className="size-4" /> Download receipt
                            </Button>
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

      <ProofDialog payment={proofTarget} onClose={() => setProofTarget(null)} upload={fees.uploadProof} submitting={fees.submitting} />
    </>
  );
}

function ProofDialog({
  payment,
  onClose,
  upload,
  submitting,
}: {
  payment: Payment | null;
  onClose: () => void;
  upload: ReturnType<typeof useMyPayments>["uploadProof"];
  submitting: boolean;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [txn, setTxn] = React.useState("");

  const submit = async () => {
    if (!payment || !file) return;
    const ok = await upload(payment.id, file, txn || undefined);
    if (ok) { setFile(null); setTxn(""); onClose(); }
  };

  return (
    <Dialog open={!!payment} onOpenChange={(o) => !o && onClose()}>
      {payment && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload payment proof</DialogTitle>
            <DialogDescription>{payment.feeStructure?.name ?? "Hostel fee"} · {money(remaining(payment))}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="proof-file">Receipt / screenshot</Label>
              <Input id="proof-file" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proof-txn">Transaction ID (optional)</Label>
              <Input id="proof-txn" value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="e.g. TRX-12345" />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button disabled={!file || submitting} onClick={submit}>
              Upload proof
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
