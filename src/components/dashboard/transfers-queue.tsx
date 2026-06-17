"use client";

import * as React from "react";
import { ArrowRight, Check, Search, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useTransfers } from "@/lib/features/allocation/useTransfers";
import type { RoomTransfer } from "@/lib/features/allocation/types";

const nameOf = (r: RoomTransfer) =>
  r.student?.user?.full_name ?? r.student?.student_id ?? r.student?.user?.email ?? "Student";
const targetOf = (r: RoomTransfer) =>
  r.toRoom?.room_number ? `Room ${r.toRoom.room_number}` : r.preferredRoomType?.name ?? "Any available";

/** Shared admin/warden room-transfer queue: review (approve/reject) + complete. */
export function TransfersQueue() {
  const { transfers, loading, error, review, complete, busyId } = useTransfers();
  const [search, setSearch] = React.useState("");
  const [rejecting, setRejecting] = React.useState<RoomTransfer | null>(null);

  const match = (r: RoomTransfer) =>
    nameOf(r).toLowerCase().includes(search.toLowerCase()) ||
    (r.fromRoom?.room_number ?? "").toLowerCase().includes(search.toLowerCase());
  const all = transfers.filter(match);
  const pending = all.filter((r) => r.status === "pending");
  const approved = all.filter((r) => r.status === "approved");
  const completed = transfers.filter((r) => r.status === "completed");

  return (
    <>
      <PageHeader title="Room transfers" description="Review move requests, approve and finalize transfers." />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Pending" value={String(transfers.filter((r) => r.status === "pending").length)} trend="flat" hint="needs review" />
        <StatCard label="Approved" value={String(transfers.filter((r) => r.status === "approved").length)} hint="ready to complete" />
        <StatCard label="Completed" value={String(completed.length)} hint="moved" />
        <StatCard label="Total" value={String(transfers.length)} hint="all requests" />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Transfer queue</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search student or room…" className="h-9 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <TransferTable rows={pending} loading={loading} busyId={busyId} onApprove={(id) => review(id, "approved", "Approved")} onReject={setRejecting} onComplete={complete} />
            </TabsContent>
            <TabsContent value="approved">
              <TransferTable rows={approved} loading={loading} busyId={busyId} onApprove={(id) => review(id, "approved", "Approved")} onReject={setRejecting} onComplete={complete} />
            </TabsContent>
            <TabsContent value="all">
              <TransferTable rows={all} loading={loading} busyId={busyId} onApprove={(id) => review(id, "approved", "Approved")} onReject={setRejecting} onComplete={complete} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title="Reject transfer"
        description={rejecting ? `Reject ${nameOf(rejecting)}'s transfer request?` : ""}
        confirmLabel="Reject"
        destructive
        withReason
        reasonLabel="Remarks"
        busy={!!rejecting && busyId === rejecting.id}
        onConfirm={(reason) => {
          if (rejecting) {
            review(rejecting.id, "rejected", reason || "Rejected");
            setRejecting(null);
          }
        }}
      />
    </>
  );
}

function TransferTable({
  rows,
  loading,
  busyId,
  onApprove,
  onReject,
  onComplete,
}: {
  rows: RoomTransfer[];
  loading: boolean;
  busyId: string | null;
  onApprove: (id: string) => void;
  onReject: (r: RoomTransfer) => void;
  onComplete: (id: string) => void;
}) {
  if (loading) return <SkeletonTable cols={5} />;
  if (rows.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">No transfers here.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Move</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <p className="font-medium">{nameOf(r)}</p>
              {r.student?.student_id && <p className="text-xs text-muted-foreground">{r.student.student_id}</p>}
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="font-medium text-foreground">{r.fromRoom?.room_number ?? "—"}</span>
                <ArrowRight className="size-3.5" />
                <span>{targetOf(r)}</span>
              </span>
            </TableCell>
            <TableCell className="max-w-[14rem] truncate text-muted-foreground" title={r.reason}>{r.reason}</TableCell>
            <TableCell><StatusBadge status={r.status} /></TableCell>
            <TableCell className="text-right">
              {r.status === "pending" ? (
                <div className="flex justify-end gap-1.5">
                  <Button size="icon-sm" variant="outline" className="text-success" disabled={busyId === r.id} onClick={() => onApprove(r.id)}>
                    <Check className="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="outline" className="text-destructive" disabled={busyId === r.id} onClick={() => onReject(r)}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : r.status === "approved" ? (
                <Button size="sm" disabled={busyId === r.id} onClick={() => onComplete(r.id)}>
                  Complete
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
