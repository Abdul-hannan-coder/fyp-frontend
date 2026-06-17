"use client";

import * as React from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SkeletonTable } from "@/components/ui/skeleton";
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
import { useMyRefunds } from "@/lib/features/fees/useFees";

const money = (v: string | number) => `₨ ${Number(v).toLocaleString()}`;

export default function StudentRefunds() {
  const rf = useMyRefunds();
  const { refunds, loading, error } = rf;

  const pending = refunds.filter((r) => r.status === "pending").length;
  const processed = refunds.filter((r) => r.status === "processed").length;

  return (
    <>
      <PageHeader
        title="Refunds"
        description="Refunds are issued by the hostel administration. Track the status of yours here."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Requests" value={String(refunds.length)} hint="on record" />
        <StatCard label="Pending" value={String(pending)} trend="flat" hint="under review" />
        <StatCard label="Processed" value={String(processed)} trend="up" hint="completed" />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My refund requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonTable cols={5} />
          ) : refunds.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No refunds on record. The hostel administration will raise a refund on your behalf when one applies.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.payment?.receipt_number ?? "—"}</TableCell>
                    <TableCell>{money(r.amount)}</TableCell>
                    <TableCell className="max-w-[16rem] truncate text-muted-foreground" title={r.reason}>{r.reason}</TableCell>
                    <TableCell className="max-w-[14rem] truncate text-muted-foreground" title={r.remarks ?? ""}>{r.remarks ?? "—"}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={r.status} /></TableCell>
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
