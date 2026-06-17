"use client";

import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePayments } from "@/lib/features/fees/useFees";

const money = (v: string | number) => `₨ ${Number(v).toLocaleString()}`;
const nameOf = (p: { student?: { user?: { full_name: string }; student_id?: string } }) =>
  p.student?.user?.full_name ?? p.student?.student_id ?? "Resident";

export default function WardenFees() {
  const { payments, loading, error } = usePayments();

  const paid = payments.filter((p) => p.status === "paid").length;
  const partial = payments.filter((p) => p.status === "partial").length;
  const overdue = payments.filter((p) => p.status === "overdue" || p.status === "pending").length;

  return (
    <>
      <PageHeader title="Fees (operations)" description="Payment status and proof review for your residents." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Paid" value={String(paid)} trend="up" hint="verified" />
        <StatCard label="Partial" value={String(partial)} trend="flat" hint="part-paid" />
        <StatCard label="Pending / Overdue" value={String(overdue)} trend="flat" hint="follow up" />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resident payment status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          ) : payments.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No payment records yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{nameOf(p)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.feeStructure?.name ?? "Hostel fee"}</TableCell>
                    <TableCell>{money(p.total_amount)}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
