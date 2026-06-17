"use client";

import * as React from "react";
import { Check, Loader2, Search, X } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { useAllocationRequests } from "@/lib/features/allocation/useAllocation";
import type { AllocationRequest } from "@/lib/features/allocation/types";

const nameOf = (r: AllocationRequest) => r.student?.user?.full_name ?? r.student?.student_id ?? "Student";

export default function AdminAllocations() {
  const { requests, loading, error, review, busyId } = useAllocationRequests();
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<AllocationRequest | null>(null);
  const [rejecting, setRejecting] = React.useState<AllocationRequest | null>(null);

  const match = (r: AllocationRequest) => nameOf(r).toLowerCase().includes(search.toLowerCase());
  const all = requests.filter(match);
  const pending = all.filter((r) => r.status === "pending");
  const allocated = all.filter((r) => r.status === "allocated" || r.status === "approved");

  const live = selected ? requests.find((r) => r.id === selected.id) ?? selected : null;

  return (
    <>
      <PageHeader title="Allocations" description="Oversight of requests, allocations and transfers." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Allocated" value={String(allocated.length)} hint="placed residents" />
        <StatCard label="Pending requests" value={String(pending.length)} trend="flat" hint="awaiting review" />
        <StatCard label="Total requests" value={String(requests.length)} hint="this cycle" />
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Requests</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search student…" className="h-9 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="allocated">Allocated</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <TabsContent value="pending"><ReqTable rows={pending} loading={loading} review={review} busyId={busyId} onView={setSelected} onReject={setRejecting} /></TabsContent>
            <TabsContent value="allocated"><ReqTable rows={allocated} loading={loading} review={review} busyId={busyId} onView={setSelected} onReject={setRejecting} /></TabsContent>
            <TabsContent value="all"><ReqTable rows={all} loading={loading} review={review} busyId={busyId} onView={setSelected} onReject={setRejecting} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {live && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{nameOf(live)}</DialogTitle>
              <DialogDescription>Allocation request</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <Row label="Status" value={<StatusBadge status={live.status} />} />
              <Row label="Room type" value={live.preferredRoomType?.name ?? "Any"} />
              <Row label="Preferred block" value={live.preferredBlock?.name ?? "Any"} />
              <Row label="Term" value={`${live.academic_year} · ${live.semester}`} />
              {live.reason && <Row label="Reason" value={live.reason} />}
              {live.createdAt && <Row label="Requested" value={String(live.createdAt).slice(0, 10)} />}
            </div>
            {live.status === "pending" && (
              <DialogFooter showCloseButton>
                <Button variant="outline" className="text-destructive" disabled={busyId === live.id}
                  onClick={() => { setRejecting(live); setSelected(null); }}>
                  <X className="size-4" /> Reject
                </Button>
                <Button disabled={busyId === live.id} onClick={() => { review(live.id, "approved"); setSelected(null); }}>
                  {busyId === live.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title="Reject request"
        description={rejecting ? `Reject ${nameOf(rejecting)}'s allocation request?` : ""}
        confirmLabel="Reject"
        destructive
        withReason
        reasonLabel="Reason"
        busy={!!rejecting && busyId === rejecting.id}
        onConfirm={(reason) => { if (rejecting) { review(rejecting.id, "rejected", reason || "Rejected"); setRejecting(null); } }}
      />
    </>
  );
}

function ReqTable({
  rows,
  loading,
  review,
  busyId,
  onView,
  onReject,
}: {
  rows: AllocationRequest[];
  loading: boolean;
  review: (id: string, decision: "approved" | "rejected", remarks?: string) => void;
  busyId: string | null;
  onView: (r: AllocationRequest) => void;
  onReject: (r: AllocationRequest) => void;
}) {
  if (loading)
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  if (rows.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">No requests here.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Room type</TableHead>
          <TableHead>Term</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id} className="cursor-pointer" onClick={() => onView(r)}>
            <TableCell className="font-medium">{nameOf(r)}</TableCell>
            <TableCell className="text-muted-foreground">{r.preferredRoomType?.name ?? "Any"}</TableCell>
            <TableCell className="text-muted-foreground">{r.academic_year}</TableCell>
            <TableCell><StatusBadge status={r.status} /></TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              {r.status === "pending" ? (
                <div className="flex justify-end gap-1.5">
                  <Button size="icon-sm" variant="outline" className="text-success" disabled={busyId === r.id} onClick={() => review(r.id, "approved")}>
                    {busyId === r.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  </Button>
                  <Button size="icon-sm" variant="outline" className="text-destructive" disabled={busyId === r.id}
                    onClick={() => onReject(r)}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => onView(r)}>View</Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
