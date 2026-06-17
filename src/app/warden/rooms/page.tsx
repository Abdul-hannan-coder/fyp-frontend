"use client";

import * as React from "react";
import { Loader2, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAsync } from "@/lib/useAsync";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedTable } from "@/components/ui/animated-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRooms, roomsApi, type Room } from "@/lib/features/rooms";
import SimpleSelect from "@/components/ui/simple-select";

const STATUSES = ["available", "occupied", "maintenance", "reserved"];

export default function WardenRooms() {
  const { rooms, loading, error, setStatus, busyId } = useRooms();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Room | null>(null);

  const filtered = rooms.filter((r) => {
    const matchesSearch = r.room_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const available = rooms.filter((r) => r.status === "available").length;
  const live = selected ? rooms.find((r) => r.id === selected.id) ?? selected : null;

  return (
    <>
      <PageHeader title="Rooms" description="Occupancy and room status across all blocks." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total rooms" value={String(rooms.length)} hint="all blocks" />
        <StatCard label="Occupied" value={String(occupied)} trend="up" hint={rooms.length ? `${Math.round((occupied / rooms.length) * 100)}%` : "—"} />
        <StatCard label="Available" value={String(available)} hint="ready to allocate" />
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Rooms ({filtered.length})</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <SimpleSelect
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full"
              options={[{ value: "all", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
            />
            <div className="relative w-full max-w-[14rem]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search room…" className="h-9 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          ) : (
            <AnimatedTable
              rows={filtered}
              getRowId={(r) => r.id}
              onRowClick={(r) => setSelected(r)}
              exportName="rooms"
              emptyLabel="No rooms match your filters."
              columns={[
                { key: "room_number", header: "Room", className: "font-medium", sortValue: (r) => r.room_number },
                { key: "type", header: "Type", className: "text-muted-foreground", sortValue: (r) => r.roomType?.name ?? "", render: (r) => r.roomType?.name ?? "—" },
                {
                  key: "occupancy", header: "Occupancy", className: "text-muted-foreground",
                  sortValue: (r) => r.current_occupancy ?? 0,
                  render: (r) => `${r.current_occupancy ?? 0}${r.roomType?.capacity ? ` / ${r.roomType.capacity}` : ""}`,
                },
                { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
                { key: "actions", header: "Action", align: "right", render: (r) => <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>Manage</Button> },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {live && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Room {live.room_number}</DialogTitle>
              <DialogDescription>
                {live.roomType?.name ?? "Room"} · currently {live.status}
                {live.total_price != null ? ` · ₨ ${Number(live.total_price).toLocaleString()}/term` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <p className="text-sm font-medium">Set status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((s) => (
                  <Button key={s} variant={live.status === s ? "secondary" : "outline"} size="sm"
                    disabled={busyId === live.id || live.status === s}
                    onClick={() => setStatus(live.id, s)} className="capitalize justify-start">
                    {busyId === live.id ? <Loader2 className="size-4 animate-spin" /> : null} {s}
                  </Button>
                ))}
              </div>
            </div>
            <RoomImages roomId={live.id} />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function RoomImages({ roomId }: { roomId: string }) {
  const q = useAsync(() => roomsApi.images(roomId), [roomId]);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      await roomsApi.uploadImages(roomId, Array.from(files));
      toast.success("Images uploaded");
      await q.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (imageId: string) => {
    setBusy(true);
    try {
      await roomsApi.deleteImage(roomId, imageId);
      await q.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const images = q.data ?? [];
  return (
    <div className="space-y-2 border-t pt-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Photos ({images.length})</p>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        <Button size="sm" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload
        </Button>
      </div>
      {images.length === 0 ? (
        <p className="text-xs text-muted-foreground">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_url} alt="Room" className="size-full object-cover" />
              <button onClick={() => remove(img.id)} disabled={busy}
                className="absolute right-1 top-1 hidden rounded-md bg-background/80 p-1 text-destructive group-hover:block">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
