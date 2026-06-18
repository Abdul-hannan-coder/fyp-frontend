"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, Search, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import SimpleSelect from "@/components/ui/simple-select";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { useAsync } from "@/lib/useAsync";
import { useAllocationRequests, useAllocations, useReserveRoom } from "@/lib/features/allocation/useAllocation";
import type { Allocation, AllocationRequest } from "@/lib/features/allocation/types";
import { usersApi } from "@/lib/features/users/api";
import type { ManagedUser } from "@/lib/features/users/types";

const nameOf = (r: AllocationRequest) => r.student?.user?.full_name ?? r.student?.student_id ?? "Student";
const allocNameOf = (a: Allocation) => a.student?.user?.full_name ?? a.student?.student_id ?? "Resident";
const date = (v?: string | null) => (v ? String(v).slice(0, 10) : "—");

export default function AdminAllocations() {
  const router = useRouter();
  const { requests, loading, error, review, busyId, refetch } = useAllocationRequests();
  const { allocations, loading: allocLoading, error: allocError } = useAllocations();
  const [search, setSearch] = React.useState("");
  const [allocSearch, setAllocSearch] = React.useState("");
  const [selected, setSelected] = React.useState<AllocationRequest | null>(null);
  const [rejecting, setRejecting] = React.useState<AllocationRequest | null>(null);

  const match = (r: AllocationRequest) => nameOf(r).toLowerCase().includes(search.toLowerCase());
  const all = requests.filter(match);
  const pending = all.filter((r) => r.status === "pending");
  const allocated = all.filter((r) => r.status === "allocated" || r.status === "approved");

  const live = selected ? requests.find((r) => r.id === selected.id) ?? selected : null;

  const confirmed = allocations.filter((a) =>
    allocNameOf(a).toLowerCase().includes(allocSearch.toLowerCase()) ||
    (a.room?.room_number ?? "").toLowerCase().includes(allocSearch.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Allocations" description="Oversight of requests, allocations and transfers.">
        <ReserveRoomDialog onReserved={refetch} />
      </PageHeader>

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
          <Tabs defaultValue="all">
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

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Confirmed allocations</CardTitle>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search resident or room…" className="h-9 pl-9" value={allocSearch} onChange={(e) => setAllocSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {allocError && <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{allocError}</div>}
          {allocLoading && confirmed.length === 0 ? (
            <SkeletonTable cols={5} />
          ) : confirmed.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No confirmed allocations.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmed.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => router.push(`/admin/allocations/${a.id}`)}>
                    <TableCell>
                      <p className="font-medium">{allocNameOf(a)}</p>
                      {a.student?.student_id && <p className="text-xs text-muted-foreground">{a.student.student_id}</p>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.room?.room_number ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{a.academic_year}</TableCell>
                    <TableCell className="text-muted-foreground">{date(a.check_in_date)}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={a.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
                  <Check className="size-4" /> Approve
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
  if (loading) return <SkeletonTable cols={5} />;
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
                    <Check className="size-4" />
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

// Reserve the room a student selected at signup (POST /allocations/reserve { user_id }).
// The room is whatever the user picked when applying, so we only pick the user.
function ReserveRoomDialog({ onReserved }: { onReserved: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [userId, setUserId] = React.useState("");
  const { busy, reserve } = useReserveRoom(() => {
    onReserved();
    setOpen(false);
    setUserId("");
  });

  const usersQ = useAsync(
    () => usersApi.list({ role: "student", limit: 200 }),
    [String(open)],
    { enabled: open },
  );

  // Only users who actually selected a room at signup can be reserved.
  const candidates = (usersQ.data ?? []).filter((u) => u.selectedRoom || u.selected_room_id);
  const selected = candidates.find((u) => u.id === userId);

  React.useEffect(() => {
    if (open && !userId && candidates[0]) setUserId(candidates[0].id);
  }, [open, userId, candidates]);

  const roomLabel = (u: ManagedUser) => (u.selectedRoom ? ` · Room ${u.selectedRoom.room_number}` : "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <KeyRound className="size-4" /> Reserve room
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reserve room</DialogTitle>
          <DialogDescription>
            Reserve the room a resident selected at signup and raise their payment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {usersQ.loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : usersQ.error ? (
            <p className="text-sm text-destructive">{usersQ.error}</p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No residents with a selected room are awaiting reservation.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Resident</Label>
                <SimpleSelect
                  value={userId}
                  onChange={setUserId}
                  className="w-full"
                  options={candidates.map((u) => ({
                    value: u.id,
                    label: `${u.full_name}${roomLabel(u)}`,
                  }))}
                />
              </div>
              {selected && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">{selected.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selected.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Selected room: {selected.selectedRoom?.room_number ?? "—"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!userId || busy || candidates.length === 0} onClick={() => reserve(userId)}>
            Reserve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
