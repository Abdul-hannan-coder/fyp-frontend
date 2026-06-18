"use client";

import * as React from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useAsync } from "@/lib/useAsync";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { useAllocationRequests } from "@/lib/features/allocation/useAllocation";
import { allocationApi } from "@/lib/features/allocation/api";
import { studentsApi } from "@/lib/features/students";
import { roomsApi } from "@/lib/features/rooms";
import type { AllocationRequest } from "@/lib/features/allocation/types";
import SimpleSelect from "@/components/ui/simple-select";
import { SkeletonTable } from "@/components/ui/skeleton";

const priorityLabel = (n?: number) => (n && n >= 2 ? "high" : n === 1 ? "medium" : "low");
const priorityColor: Record<string, string> = {
  high: "bg-destructive/12 text-destructive border-destructive/25",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground",
};
const nameOf = (r: AllocationRequest) => r.student?.user?.full_name ?? r.student?.student_id ?? "Student";

export default function WardenAllocation() {
  const { requests, loading, error, review, busyId, refetch } = useAllocationRequests();
  const [search, setSearch] = React.useState("");
  const [rejecting, setRejecting] = React.useState<AllocationRequest | null>(null);

  const match = (r: AllocationRequest) => nameOf(r).toLowerCase().includes(search.toLowerCase());
  const all = requests.filter(match);
  const pending = all.filter((r) => r.status === "pending");

  return (
    <>
      <PageHeader title="Room allocation" description="Review requests, allocate rooms and manage transfers.">
        <DirectAllocateDialog onDone={refetch} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending requests" value={String(pending.length)} trend="flat" hint="needs review" />
        <StatCard label="Total requests" value={String(requests.length)} hint="this cycle" />
        <StatCard label="Allocated" value={String(requests.filter((r) => r.status === "allocated").length)} hint="placed" />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

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
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <RequestTable rows={pending} loading={loading} actions busyId={busyId} onReview={review} onReject={setRejecting} />
            </TabsContent>
            <TabsContent value="all">
              <RequestTable rows={all} loading={loading} busyId={busyId} onReview={review} onReject={setRejecting} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title="Reject request"
        description={rejecting ? `Reject ${nameOf(rejecting)}'s allocation request?` : ""}
        confirmLabel="Reject"
        destructive
        withReason
        busy={!!rejecting && busyId === rejecting.id}
        onConfirm={(reason) => { if (rejecting) { review(rejecting.id, "rejected", reason || "Rejected"); setRejecting(null); } }}
      />
    </>
  );
}

function RequestTable({
  rows,
  loading,
  actions,
  busyId,
  onReview,
  onReject,
}: {
  rows: AllocationRequest[];
  loading: boolean;
  actions?: boolean;
  busyId: string | null;
  onReview: (id: string, d: "approved" | "rejected", remarks?: string) => void;
  onReject?: (r: AllocationRequest) => void;
}) {
  if (loading) return <SkeletonTable cols={4} />;
  if (rows.length === 0)
    return <p className="py-10 text-center text-sm text-muted-foreground">No requests here.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Room type</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead className="text-right">{actions ? "Action" : "Status"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const pr = priorityLabel(r.priority);
          return (
            <TableRow key={r.id}>
              <TableCell>
                <p className="font-medium">{nameOf(r)}</p>
                <p className="text-xs text-muted-foreground">{r.academic_year} · {r.semester}</p>
              </TableCell>
              <TableCell className="text-muted-foreground">{r.preferredRoomType?.name ?? "Any"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`capitalize ${priorityColor[pr]}`}>{pr}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {actions && r.status === "pending" ? (
                  <div className="flex justify-end gap-1.5">
                    <Button size="icon-sm" variant="outline" className="text-success" disabled={busyId === r.id}
                      onClick={() => onReview(r.id, "approved", "Approved")}>
                      <Check className="size-4" />
                    </Button>
                    <Button size="icon-sm" variant="outline" className="text-destructive" disabled={busyId === r.id}
                      onClick={() => onReject?.(r)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <StatusBadge status={r.status} />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function DirectAllocateDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = React.useState(false);
  const students = useAsync(() => studentsApi.list(), [], { enabled: open });
  const rooms = useAsync(() => roomsApi.available(), [], { enabled: open });

  const [studentId, setStudentId] = React.useState("");
  const [roomId, setRoomId] = React.useState("");
  const [year, setYear] = React.useState("2026-2027");
  const [semester, setSemester] = React.useState("Fall");
  const [busy, setBusy] = React.useState(false);

  const valid = studentId && roomId && year.trim() && semester.trim();

  const submit = async () => {
    setBusy(true);
    try {
      await allocationApi.allocate({ student_id: studentId, room_id: roomId, academic_year: year, semester });
      toast.success("Room allocated");
      onDone();
      setStudentId(""); setRoomId("");
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Direct allocate
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Direct allocate</DialogTitle>
          <DialogDescription>Place a student into an available room.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Student</Label>
            <SimpleSelect value={studentId} onChange={setStudentId} disabled={students.loading} className="w-full" placeholder={students.loading ? "Loading…" : "Select a student…"} options={(students.data ?? []).map((s) => ({ value: s.id, label: s.user?.full_name ?? s.student_id ?? s.id }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Available room</Label>
            <SimpleSelect value={roomId} onChange={setRoomId} disabled={rooms.loading} className="w-full" placeholder={rooms.loading ? "Loading…" : "Select a room…"} options={(rooms.data ?? []).map((r) => ({ value: r.id, label: `${r.room_number}${r.roomType?.name ? ` · ${r.roomType.name}` : ""}` }))} />
            {!rooms.loading && (rooms.data ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">No available rooms. Create rooms in Hostel Setup first.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="da-year">Academic year</Label>
              <Input id="da-year" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="da-sem">Semester</Label>
              <Input id="da-sem" value={semester} onChange={(e) => setSemester(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!valid || busy} onClick={submit}>
            Allocate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
