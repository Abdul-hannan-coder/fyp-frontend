"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { useAsync } from "@/lib/useAsync";
import {
  roomsApi,
  usePackages,
  type Room,
  type RoomPackage,
  type PackageInput,
} from "@/lib/features/rooms";
import { amenitiesApi, type Amenity } from "@/lib/features/amenities";

const money = (v: unknown) => `₨ ${Number(v || 0).toLocaleString()}`;

export default function AdminPackages() {
  const p = usePackages();
  const roomsQ = useAsync(() => roomsApi.rooms(), []);
  const amenitiesQ = useAsync(() => amenitiesApi.list(), []);
  const rooms = roomsQ.data ?? [];
  const amenities = amenitiesQ.data ?? [];

  const published = p.packages.filter((x) => x.is_published).length;

  return (
    <>
      <PageHeader title="Packages" description="Offers that bundle a room with priced incentives for the public landing page.">
        <PackageDialog
          mode="create"
          rooms={rooms}
          amenities={amenities}
          busy={p.busy}
          onSubmit={(b) => p.create(b)}
        />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total packages" value={String(p.packages.length)} hint="created" />
        <StatCard label="Published" value={String(published)} hint="live on landing" />
        <StatCard label="Drafts" value={String(p.packages.length - published)} trend="flat" hint="not published" />
      </div>

      {p.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{p.error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All packages</CardTitle>
        </CardHeader>
        <CardContent>
          {p.loading ? (
            <Loading />
          ) : p.packages.length === 0 ? (
            <Empty text="No packages yet — create one to feature a room on the landing page." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Incentives</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {pkg.room?.room_number ? `Room ${pkg.room.room_number}` : "—"}
                      {pkg.room?.block?.name ? ` · ${pkg.room.block.name}` : ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{pkg.incentives?.length ?? 0}</TableCell>
                    <TableCell className="font-medium">{money(pkg.total_price)}</TableCell>
                    <TableCell>
                      <StatusBadge status={pkg.is_published ? "published" : "draft"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={p.busy}
                          onClick={() => p.publish(pkg.id, !pkg.is_published)}
                        >
                          {pkg.is_published ? "Unpublish" : "Publish"}
                        </Button>
                        <PackageDialog
                          mode="edit"
                          pkg={pkg}
                          rooms={rooms}
                          amenities={amenities}
                          busy={p.busy}
                          onSubmit={(b) => p.update(pkg.id, b)}
                        />
                        <Button variant="ghost" size="icon" disabled={p.busy} onClick={() => p.remove(pkg.id)} aria-label="Delete package">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
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

// ── Create / edit dialog ──
function PackageDialog({
  mode,
  pkg,
  rooms,
  amenities,
  busy,
  onSubmit,
}: {
  mode: "create" | "edit";
  pkg?: RoomPackage;
  rooms: Room[];
  amenities: Amenity[];
  busy: boolean;
  onSubmit: (b: PackageInput) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [roomId, setRoomId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [incentiveIds, setIncentiveIds] = React.useState<string[]>([]);

  const reset = React.useCallback(() => {
    setName(pkg?.name ?? "");
    setRoomId(pkg?.room_id ?? pkg?.room?.id ?? "");
    setDescription(pkg?.description ?? "");
    setIncentiveIds(pkg?.incentives?.map((a) => a.id) ?? []);
  }, [pkg]);

  React.useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const toggleIncentive = (id: string) => {
    setIncentiveIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const base = Number(selectedRoom?.base_price ?? pkg?.base_price_snapshot ?? 0);
  const extras = amenities
    .filter((a) => incentiveIds.includes(a.id))
    .reduce((sum, a) => sum + Number(a.price || 0), 0);
  const total = base + extras;

  const submit = async () => {
    const ok = await onSubmit({
      name: name.trim(),
      room_id: roomId,
      description: description.trim() || undefined,
      incentive_ids: incentiveIds,
    });
    if (ok) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          mode === "create" ? (
            <Button />
          ) : (
            <Button variant="ghost" size="icon" aria-label="Edit package" />
          )
        }
      >
        {mode === "create" ? (
          <>
            <Plus className="size-4" /> New package
          </>
        ) : (
          <Pencil className="size-4" />
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New package" : "Edit package"}</DialogTitle>
          <DialogDescription>Bundle a room with chosen incentives. The total is snapshotted at save time.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pkg-name">Name</Label>
            <Input id="pkg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Premium Single — Spring Offer" />
          </div>
          <div className="space-y-1.5">
            <Label>Room</Label>
            {rooms.length === 0 && <p className="text-xs text-muted-foreground">No rooms available.</p>}
            <SimpleSelect
              value={roomId}
              onChange={setRoomId}
              className="w-full"
              placeholder="Select a room"
              options={rooms.map((r) => ({
                value: r.id,
                label: `Room ${r.room_number}${r.base_price ? ` · ${money(r.base_price)}` : ""}`,
              }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-desc">Description</Label>
            <Textarea id="pkg-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional marketing blurb" />
          </div>
          <div className="space-y-1.5">
            <Label>Incentives</Label>
            {amenities.length === 0 ? (
              <p className="text-xs text-muted-foreground">No amenities defined yet.</p>
            ) : (
              <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
                {amenities.map((a) => (
                  <label key={a.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={incentiveIds.includes(a.id)}
                        onChange={() => toggleIncentive(a.id)}
                        className="size-4 accent-primary"
                      />
                      {a.name}
                    </span>
                    <span className="text-muted-foreground">{money(a.price)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Total / term</span>
            <span className="font-heading text-base font-semibold text-primary">{money(total)}</span>
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!name.trim() || !roomId || busy} onClick={submit}>
            {busy && <Loader2 className="size-4 animate-spin" />} {mode === "create" ? "Create package" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ──
function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Loading…
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;
}
