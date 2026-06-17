"use client";

import * as React from "react";
import { ArrowLeftRight, Plus } from "lucide-react";
import { SkeletonTable } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAsync } from "@/lib/useAsync";
import { roomsApi } from "@/lib/features/rooms";
import { useMyTransfers } from "@/lib/features/allocation/useTransfers";
import type { RoomTransfer } from "@/lib/features/allocation/types";

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "—");

export default function StudentTransfers() {
  const t = useMyTransfers();
  const { transfers, loading, error } = t;
  const [cancelling, setCancelling] = React.useState<RoomTransfer | null>(null);

  const pending = transfers.filter((r) => r.status === "pending");
  const completed = transfers.filter((r) => r.status === "completed");
  const hasPending = pending.length > 0;

  return (
    <>
      <PageHeader title="Room transfer" description="Request to move rooms and track your requests.">
        <RequestDialog busy={t.busy === "create"} disabled={hasPending} onCreate={t.create} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total requests" value={String(transfers.length)} hint="all time" />
        <StatCard label="Pending" value={String(pending.length)} trend="flat" hint="awaiting review" />
        <StatCard label="Completed" value={String(completed.length)} hint="moved" />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My transfer requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonTable cols={6} />
          ) : transfers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No transfer requests yet — submit one to move rooms.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.fromRoom?.room_number ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.toRoom?.room_number
                        ? `Room ${r.toRoom.room_number}`
                        : r.preferredRoomType?.name ?? "Any available"}
                    </TableCell>
                    <TableCell className="max-w-[16rem] truncate text-muted-foreground" title={r.reason}>
                      {r.reason}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(r.created_at)}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          disabled={t.busy === r.id}
                          onClick={() => setCancelling(r)}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Cancel transfer request"
        description="This will withdraw your pending transfer request. You can submit a new one afterwards."
        confirmLabel="Cancel request"
        destructive
        busy={!!cancelling && t.busy === cancelling.id}
        onConfirm={async () => {
          if (cancelling) {
            const id = cancelling.id;
            setCancelling(null);
            await t.cancel(id);
          }
        }}
      />
    </>
  );
}

function RequestDialog({
  busy,
  disabled,
  onCreate,
}: {
  busy: boolean;
  disabled: boolean;
  onCreate: (b: { reason: string; to_room_id?: string; preferred_room_type_id?: string }) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const rooms = useAsync(() => roomsApi.available(), [], { enabled: open });
  const types = useAsync(() => roomsApi.roomTypes(), [], { enabled: open });

  // "" = no preference; "room:<id>" = specific room; "type:<id>" = preferred type.
  const [target, setTarget] = React.useState("");
  const [reason, setReason] = React.useState("");

  const targetOptions = React.useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: "", label: "Any available room" }];
    for (const ty of types.data ?? []) opts.push({ value: `type:${ty.id}`, label: `Preferred type · ${ty.name}` });
    for (const rm of rooms.data ?? [])
      opts.push({ value: `room:${rm.id}`, label: `Room ${rm.room_number}${rm.roomType?.name ? ` · ${rm.roomType.name}` : ""}` });
    return opts;
  }, [rooms.data, types.data]);

  const submit = async () => {
    const body: { reason: string; to_room_id?: string; preferred_room_type_id?: string } = { reason: reason.trim() };
    if (target.startsWith("room:")) body.to_room_id = target.slice(5);
    else if (target.startsWith("type:")) body.preferred_room_type_id = target.slice(5);
    const ok = await onCreate(body);
    if (ok) {
      setReason("");
      setTarget("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button disabled={disabled} />}>
        {disabled ? <ArrowLeftRight className="size-4" /> : <Plus className="size-4" />}
        {disabled ? "Request pending" : "Request transfer"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a room transfer</DialogTitle>
          <DialogDescription>Choose where you want to move and tell us why. Staff will review it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Destination</Label>
            <SimpleSelect
              value={target}
              onChange={setTarget}
              disabled={rooms.loading || types.loading}
              className="w-full"
              options={targetOptions}
            />
            <p className="text-xs text-muted-foreground">
              Leave as &ldquo;Any available room&rdquo; to let staff place you, or pick a specific room / preferred type.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tr-reason">Reason</Label>
            <Textarea
              id="tr-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Closer to my department, roommate conflict…"
            />
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!reason.trim() || busy} onClick={submit}>
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
