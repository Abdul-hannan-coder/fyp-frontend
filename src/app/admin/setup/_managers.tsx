"use client";

import * as React from "react";
import Link from "next/link";
import { BedDouble, Building2, Check, DoorOpen, ImageIcon, Pencil, Plus, RotateCcw, Search, Trash2, Upload, Users, X } from "lucide-react";
import { SkeletonGrid } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SimpleSelect from "@/components/ui/simple-select";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { roomsApi, useRoomsAdmin, type Block, type Floor, type RoomType, type Room, type RoomTypeImage } from "@/lib/features/rooms";
import { useAmenities, type Amenity } from "@/lib/features/amenities";

const money = (v: string | number) => `₨ ${Number(v || 0).toLocaleString()}`;
const setInput = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value);

// ── Shared chrome ─────────────────────────────────────────────────────────
function SectionHead({ title, subtitle, action }: { title: string; subtitle?: string; action: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function AddButton({ open, onClick, disabled, hint }: { open: boolean; onClick: () => void; disabled?: boolean; hint?: string }) {
  return (
    <Button size="sm" variant={open ? "secondary" : "default"} onClick={onClick} disabled={disabled} title={hint}>
      {open ? <X className="size-4" /> : <Plus className="size-4" />} {open ? "Cancel" : "Add"}
    </Button>
  );
}

function FormShell({ children, busy, onCancel, submitLabel }: { children: React.ReactNode; busy: boolean; onCancel: () => void; submitLabel: string }) {
  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={busy}>{submitLabel}</Button>
      </div>
    </div>
  );
}

function RowActions({ onEdit, onDelete, busy }: { onEdit: () => void; onDelete: () => void; busy: boolean }) {
  // Stop propagation so clicking edit/delete inside a clickable card doesn't navigate.
  const guard = (fn: () => void) => (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); fn(); };
  return (
    <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon-sm" onClick={guard(onEdit)} disabled={busy} title="Edit"><Pencil className="size-4" /></Button>
      <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={guard(onDelete)} disabled={busy} title="Delete"><Trash2 className="size-4" /></Button>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">{label}</p>;
}

function AmenityPicker({ amenities, selected, onToggle }: { amenities: Amenity[]; selected: string[]; onToggle: (id: string) => void }) {
  if (amenities.length === 0) return <p className="text-xs text-muted-foreground">No amenities defined yet — add some first.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {amenities.map((a) => {
        const on = selected.includes(a.id);
        return (
          <button key={a.id} type="button" onClick={() => onToggle(a.id)}
            className={`rounded-full border px-3 py-1 text-xs transition ${on ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"}`}>
            {a.name} <span className="opacity-70">+{money(a.price)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Amenities ─────────────────────────────────────────────────────────────
export function AmenitiesManager() {
  const am = useAmenities();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Amenity | null>(null);
  const [deleting, setDeleting] = React.useState<Amenity | null>(null);

  return (
    <div className="space-y-4">
      <SectionHead title="Amenities" subtitle="Priced add-ons. Attaching them to room types adds the price automatically."
        action={<AddButton open={open} onClick={() => { setOpen((o) => !o); setEditing(null); }} />} />
      {(open || editing) && (
        <AmenityForm key={editing?.id ?? "new"} initial={editing} busy={am.busy}
          onCancel={() => { setOpen(false); setEditing(null); }}
          onSubmit={async (b) => {
            const ok = editing ? await am.update(editing.id, b) : await am.create(b);
            if (ok) { setOpen(false); setEditing(null); }
          }} />
      )}
      {am.amenities.length === 0 ? <Empty label="No amenities yet — add AC, attached bath, WiFi, etc." /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {am.amenities.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">+{money(a.price)}/term{a.description ? ` · ${a.description}` : ""}</p>
              </div>
              <RowActions busy={am.busy} onEdit={() => { setEditing(a); setOpen(false); }} onDelete={() => setDeleting(a)} />
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete amenity" destructive
        description={deleting ? `Delete "${deleting.name}"? It will be removed from room types that use it.` : ""}
        confirmLabel="Delete" busy={am.busy}
        onConfirm={async () => { if (deleting) { await am.remove(deleting.id); setDeleting(null); } }} />
    </div>
  );
}

function AmenityForm({ initial, busy, onCancel, onSubmit }: { initial: Amenity | null; busy: boolean; onCancel: () => void; onSubmit: (b: { name: string; price: number; description?: string }) => void }) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [price, setPrice] = React.useState(initial ? String(initial.price) : "");
  const [desc, setDesc] = React.useState(initial?.description ?? "");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, price: Number(price), description: desc || undefined }); }}>
      <FormShell busy={busy} onCancel={onCancel} submitLabel={initial ? "Save changes" : "Add amenity"}>
        <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={setInput(setName)} placeholder="Air Conditioning" required /></div>
        <div className="space-y-2"><Label>Price (₨ / term)</Label><Input type="number" min={0} value={price} onChange={setInput(setPrice)} placeholder="2500" required /></div>
        <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Input value={desc} onChange={setInput(setDesc)} placeholder="Split AC unit in the room" /></div>
      </FormShell>
    </form>
  );
}

// ── Blocks ────────────────────────────────────────────────────────────────
export function BlocksManager() {
  const s = useRoomsAdmin();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Block | null>(null);
  const [deleting, setDeleting] = React.useState<Block | null>(null);

  return (
    <div className="space-y-4">
      <SectionHead title="Blocks" subtitle="Residential blocks that contain floors and rooms."
        action={<AddButton open={open} onClick={() => { setOpen((o) => !o); setEditing(null); }} />} />
      {(open || editing) && (
        <BlockForm key={editing?.id ?? "new"} initial={editing} busy={s.busy}
          onCancel={() => { setOpen(false); setEditing(null); }}
          onSubmit={async (b) => { const ok = editing ? await s.updateBlock(editing.id, b) : await s.createBlock(b); if (ok) { setOpen(false); setEditing(null); } }} />
      )}
      {s.loading ? <Loading /> : s.blocks.length === 0 ? <Empty label="No blocks yet — add your first block." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.blocks.map((b) => (
            <Link key={b.id} href={`/admin/setup/blocks/${b.id}`} className="group block">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-gold/40 group-hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{b.name}</CardTitle>
                      <CardDescription>{b.total_floors ?? 0} floors{b.location ? ` · ${b.location}` : ""}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {b.gender && <Badge variant="secondary" className="font-normal capitalize">{b.gender}</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-end pt-0">
                  <RowActions busy={s.busy} onEdit={() => { setEditing(b); setOpen(false); }} onDelete={() => setDeleting(b)} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete block" destructive
        description={deleting ? `Delete "${deleting.name}"? Its floors and rooms must be empty.` : ""}
        confirmLabel="Delete" busy={s.busy}
        onConfirm={async () => { if (deleting) { await s.deleteBlock(deleting.id); setDeleting(null); } }} />
    </div>
  );
}

function BlockForm({ initial, busy, onCancel, onSubmit }: { initial: Block | null; busy: boolean; onCancel: () => void; onSubmit: (b: { name: string; total_floors: number; description?: string; gender?: string; location?: string }) => void }) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [floors, setFloors] = React.useState(initial ? String(initial.total_floors ?? 1) : "1");
  const [gender, setGender] = React.useState<string>(initial?.gender ?? "mixed");
  const [location, setLocation] = React.useState(initial?.location ?? "");
  const [desc, setDesc] = React.useState(initial?.description ?? "");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, total_floors: Number(floors), gender, location: location || undefined, description: desc || undefined }); }}>
      <FormShell busy={busy} onCancel={onCancel} submitLabel={initial ? "Save changes" : "Create block"}>
        <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={setInput(setName)} placeholder="Block A" required /></div>
        <div className="space-y-2"><Label>Total floors</Label><Input type="number" min={1} value={floors} onChange={setInput(setFloors)} /></div>
        <div className="space-y-2"><Label>Gender</Label>
          <SimpleSelect value={gender} onChange={setGender} className="w-full" options={[{ value: "boys", label: "Boys" }, { value: "girls", label: "Girls" }, { value: "mixed", label: "Mixed" }]} />
        </div>
        <div className="space-y-2"><Label>Location</Label><Input value={location} onChange={setInput(setLocation)} placeholder="North wing" /></div>
        <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Input value={desc} onChange={setInput(setDesc)} placeholder="Senior boys block" /></div>
      </FormShell>
    </form>
  );
}

// ── Floors ────────────────────────────────────────────────────────────────
export function FloorsManager() {
  const s = useRoomsAdmin();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Floor | null>(null);
  const [deleting, setDeleting] = React.useState<Floor | null>(null);
  const noBlocks = s.blocks.length === 0;

  return (
    <div className="space-y-4">
      <SectionHead title="Floors" subtitle="Floors belong to a block."
        action={<AddButton open={open} disabled={noBlocks} hint={noBlocks ? "Add a block first" : undefined} onClick={() => { setOpen((o) => !o); setEditing(null); }} />} />
      {noBlocks && <Empty label="Add a block before creating floors." />}
      {(open || editing) && (
        <FloorForm key={editing?.id ?? "new"} initial={editing} blocks={s.blocks} busy={s.busy}
          onCancel={() => { setOpen(false); setEditing(null); }}
          onSubmit={async (b) => { const ok = editing ? await s.updateFloor(editing.id, { floor_number: b.floor_number }) : await s.createFloor(b); if (ok) { setOpen(false); setEditing(null); } }} />
      )}
      {s.floors.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.floors.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
              <div><p className="font-medium">Floor {f.floor_number}</p><p className="text-xs text-muted-foreground">{f.block?.name ?? "Block"}</p></div>
              <RowActions busy={s.busy} onEdit={() => { setEditing(f); setOpen(false); }} onDelete={() => setDeleting(f)} />
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete floor" destructive
        description={deleting ? `Delete Floor ${deleting.floor_number} (${deleting.block?.name ?? "block"})? Its rooms must be empty.` : ""}
        confirmLabel="Delete" busy={s.busy}
        onConfirm={async () => { if (deleting) { await s.deleteFloor(deleting.id); setDeleting(null); } }} />
    </div>
  );
}

function FloorForm({ initial, blocks, busy, onCancel, onSubmit }: { initial: Floor | null; blocks: Block[]; busy: boolean; onCancel: () => void; onSubmit: (b: { block_id: string; floor_number: number }) => void }) {
  const [blockId, setBlockId] = React.useState(initial?.block_id ?? blocks[0]?.id ?? "");
  const [num, setNum] = React.useState(initial ? String(initial.floor_number) : "1");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ block_id: blockId, floor_number: Number(num) }); }}>
      <FormShell busy={busy} onCancel={onCancel} submitLabel={initial ? "Save changes" : "Create floor"}>
        <div className="space-y-2"><Label>Block</Label>
          <SimpleSelect value={blockId} onChange={setBlockId} className="w-full" disabled={!!initial} options={blocks.map((b) => ({ value: b.id, label: b.name }))} />
        </div>
        <div className="space-y-2"><Label>Floor number</Label><Input type="number" min={0} value={num} onChange={setInput(setNum)} /></div>
      </FormShell>
    </form>
  );
}

// ── Room types ────────────────────────────────────────────────────────────
export function RoomTypesManager() {
  const s = useRoomsAdmin();
  const am = useAmenities();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RoomType | null>(null);
  const [deleting, setDeleting] = React.useState<RoomType | null>(null);

  return (
    <div className="space-y-4">
      <SectionHead title="Room types" subtitle="Pick amenities and the price updates live — this is what residents pay."
        action={<AddButton open={open} onClick={() => { setOpen((o) => !o); setEditing(null); }} />} />
      {(open || editing) && (
        <RoomTypeForm key={editing?.id ?? "new"} initial={editing} amenities={am.amenities} busy={s.busy}
          onCancel={() => { setOpen(false); setEditing(null); }}
          onSubmit={async (b) => { const ok = editing ? await s.updateRoomType(editing.id, b) : await s.createRoomType(b); if (ok) { setOpen(false); setEditing(null); } }} />
      )}
      {s.loading ? <Loading /> : s.roomTypes.length === 0 ? <Empty label="No room types yet — these appear on the public site." /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {s.roomTypes.map((t) => (
            <Link key={t.id} href={`/admin/setup/room-types/${t.id}`} className="group block">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-gold/40 group-hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      <CardDescription>Cap {t.capacity}{t.bed_type ? ` · ${t.bed_type}` : ""}{t.size_sqft ? ` · ${t.size_sqft} sqft` : ""}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="font-heading text-lg font-semibold text-primary">{money(t.total_price ?? t.base_price)}</p>
                      <RowActions busy={s.busy} onEdit={() => { setEditing(t); setOpen(false); }} onDelete={() => setDeleting(t)} />
                    </div>
                  </div>
                </CardHeader>
                {t.amenities && t.amenities.length > 0 && (
                  <CardContent className="flex flex-wrap gap-2">
                    {t.amenities.map((a) => <Badge key={a.id} variant="secondary" className="font-normal">{a.name}</Badge>)}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete room type" destructive
        description={deleting ? `Delete "${deleting.name}"? Rooms using it must be reassigned first.` : ""}
        confirmLabel="Delete" busy={s.busy}
        onConfirm={async () => { if (deleting) { await s.deleteRoomType(deleting.id); setDeleting(null); } }} />
    </div>
  );
}

function RoomTypeForm({ initial, amenities, busy, onCancel, onSubmit }: { initial: RoomType | null; amenities: Amenity[]; busy: boolean; onCancel: () => void; onSubmit: (b: { name: string; capacity: number; base_price: number; bed_type?: string; size_sqft?: number; amenity_ids?: string[] }) => void }) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [cap, setCap] = React.useState(initial ? String(initial.capacity) : "2");
  const [price, setPrice] = React.useState(initial ? String(initial.base_price) : "");
  const [bed, setBed] = React.useState(initial?.bed_type ?? "");
  const [size, setSize] = React.useState(initial?.size_sqft ? String(initial.size_sqft) : "");
  const [selected, setSelected] = React.useState<string[]>(initial?.amenities?.map((a) => a.id) ?? []);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const addons = amenities.filter((a) => selected.includes(a.id)).reduce((sum, a) => sum + Number(a.price), 0);
  const total = (Number(price) || 0) + addons;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, capacity: Number(cap), base_price: Number(price), bed_type: bed || undefined, size_sqft: size ? Number(size) : undefined, amenity_ids: selected }); }}>
      <FormShell busy={busy} onCancel={onCancel} submitLabel={initial ? "Save changes" : "Create room type"}>
        <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={setInput(setName)} placeholder="Standard Double" required /></div>
        <div className="space-y-2"><Label>Capacity</Label><Input type="number" min={1} value={cap} onChange={setInput(setCap)} /></div>
        <div className="space-y-2"><Label>Base price (₨ / term)</Label><Input type="number" min={0} value={price} onChange={setInput(setPrice)} placeholder="12000" required /></div>
        <div className="space-y-2"><Label>Bed type</Label><Input value={bed} onChange={setInput(setBed)} placeholder="Bunk / Queen" /></div>
        <div className="space-y-2"><Label>Size (sqft)</Label><Input type="number" min={0} value={size} onChange={setInput(setSize)} placeholder="180" /></div>
        <div className="space-y-2 sm:col-span-2"><Label>Amenities (price adds automatically)</Label><AmenityPicker amenities={amenities} selected={selected} onToggle={toggle} /></div>
        <div className="sm:col-span-2 flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Total price / term</span><span className="font-heading text-lg font-semibold text-primary">{money(total)}</span>
        </div>
      </FormShell>
    </form>
  );
}

// ── Rooms ─────────────────────────────────────────────────────────────────
const ROOM_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "maintenance", label: "Maintenance" },
  { value: "reserved", label: "Reserved" },
];

export function RoomsManager() {
  const s = useRoomsAdmin();
  const am = useAmenities();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Room | null>(null);
  const [deleting, setDeleting] = React.useState<Room | null>(null);
  const blocked = s.floors.length === 0 || s.roomTypes.length === 0;

  // ── Filters ──
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [typeId, setTypeId] = React.useState("all");
  const [blockId, setBlockId] = React.useState("all");
  const [occupancy, setOccupancy] = React.useState("all");
  const [maxPrice, setMaxPrice] = React.useState<number | null>(null);

  // Price ceiling for the slider, derived from the most expensive room.
  const priceCeiling = React.useMemo(() => {
    const max = s.rooms.reduce((m, r) => Math.max(m, Number(r.total_price ?? 0)), 0);
    return Math.max(1000, Math.ceil(max / 1000) * 1000);
  }, [s.rooms]);

  // Capacities offered by the room types, for the occupancy filter.
  const capacities = React.useMemo(
    () => Array.from(new Set(s.roomTypes.map((t) => t.capacity))).sort((a, b) => a - b),
    [s.roomTypes],
  );

  const effectiveMax = maxPrice ?? priceCeiling;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return s.rooms.filter((r) => {
      if (q && !r.room_number.toLowerCase().includes(q)) return false;
      if (status !== "all" && r.status !== status) return false;
      if (typeId !== "all" && r.roomType?.id !== typeId) return false;
      if (blockId !== "all" && r.block?.id !== blockId && r.block_id !== blockId) return false;
      if (occupancy !== "all" && String(r.roomType?.capacity ?? r.capacity ?? "") !== occupancy) return false;
      if (Number(r.total_price ?? 0) > effectiveMax) return false;
      return true;
    });
  }, [s.rooms, search, status, typeId, blockId, occupancy, effectiveMax]);

  const filtersActive =
    search.trim() !== "" || status !== "all" || typeId !== "all" || blockId !== "all" || occupancy !== "all" || maxPrice !== null;

  const reset = () => {
    setSearch(""); setStatus("all"); setTypeId("all"); setBlockId("all"); setOccupancy("all"); setMaxPrice(null);
  };

  return (
    <div className="space-y-4">
      <SectionHead title="Rooms" subtitle="Rooms inherit their type's amenities and price. Override per room if needed."
        action={<AddButton open={open} disabled={blocked} hint={blocked ? "Add a floor and a room type first" : undefined} onClick={() => { setOpen((o) => !o); setEditing(null); }} />} />
      {blocked && <Empty label="Add at least one floor and one room type before creating rooms." />}
      {(open || editing) && (
        <RoomPanel key={editing?.id ?? "new"} initial={editing} floors={s.floors} roomTypes={s.roomTypes} amenities={am.amenities}
          onDone={() => { setOpen(false); setEditing(null); }}
          onCancel={() => { setOpen(false); setEditing(null); }}
          refetch={s.refetch} />
      )}

      {!blocked && s.rooms.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={setInput(setSearch)} placeholder="Search room number…" className="pl-9" />
            </div>
            <SimpleSelect value={status} onChange={setStatus} className="w-full" options={ROOM_STATUS_OPTIONS} />
            <SimpleSelect value={typeId} onChange={setTypeId} className="w-full"
              options={[{ value: "all", label: "All room types" }, ...s.roomTypes.map((t) => ({ value: t.id, label: t.name }))]} />
            <SimpleSelect value={blockId} onChange={setBlockId} className="w-full"
              options={[{ value: "all", label: "All blocks" }, ...s.blocks.map((b) => ({ value: b.id, label: b.name }))]} />
            <SimpleSelect value={occupancy} onChange={setOccupancy} className="w-full"
              options={[{ value: "all", label: "Any occupancy" }, ...capacities.map((c) => ({ value: String(c), label: `${c} ${c === 1 ? "bed" : "beds"}` }))]} />
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-xs font-medium text-muted-foreground">Max price</Label>
                <span className="font-semibold text-foreground">{maxPrice === null ? "Any" : `≤ ${money(effectiveMax)}`}</span>
              </div>
              <input type="range" min={0} max={priceCeiling} step={500}
                value={effectiveMax}
                onChange={(e) => setMaxPrice(Number(e.target.value) >= priceCeiling ? null : Number(e.target.value))}
                className="w-full accent-gold" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span> {filtered.length === 1 ? "room" : "rooms"}
              {filtered.length !== s.rooms.length && <span className="text-muted-foreground"> of {s.rooms.length}</span>}
            </p>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="size-4" /> Reset</Button>
            )}
          </div>
        </div>
      )}

      {s.loading ? <Loading /> : s.rooms.length === 0 ? <Empty label="No rooms yet — add rooms to open spots for applicants." /> : filtered.length === 0 ? (
        <Empty label="No rooms match these filters. Try adjusting or resetting them." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const img = r.images?.find((i) => i.is_primary)?.image_url ?? r.images?.[0]?.image_url;
            return (
              <Link key={r.id} href={`/admin/setup/rooms/${r.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md">
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={r.room_number} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex size-full items-center justify-center"><DoorOpen className="size-9 text-muted-foreground/25" /></div>
                  )}
                  <span className="absolute left-2.5 top-2.5"><StatusBadge status={r.status} /></span>
                </div>
                <div className="flex items-start justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold">{r.room_number}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.roomType?.name ?? "No type"}{r.block?.name ? ` · ${r.block.name}` : ""}
                    </p>
                    <p className="mt-1 font-heading text-sm font-semibold text-primary">
                      {money(r.total_price ?? 0)}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                      {r.has_custom_amenities ? <span className="ml-1 text-xs font-normal text-muted-foreground">· custom</span> : ""}
                    </p>
                  </div>
                  <RowActions busy={s.busy} onEdit={() => { setEditing(r); setOpen(false); }} onDelete={() => setDeleting(r)} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete room" destructive
        description={deleting ? `Delete room ${deleting.room_number}? It must not have an active resident.` : ""}
        confirmLabel="Delete" busy={s.busy}
        onConfirm={async () => { if (deleting) { await s.deleteRoom(deleting.id); setDeleting(null); } }} />
    </div>
  );
}

const sharing = (cap: number) => (cap <= 1 ? "Private room" : `Sharing for ${cap}`);

// Rich room editor: one form on the left, live preview on the right. Used for
// BOTH create and edit (same interface) — handles image choosing/management and
// uploads in one flow.
function RoomPanel({ initial, floors, roomTypes, amenities, onDone, onCancel, refetch }: {
  initial: Room | null;
  floors: Floor[];
  roomTypes: RoomType[];
  amenities: Amenity[];
  onDone: () => void;
  onCancel: () => void;
  refetch: () => Promise<unknown>;
}) {
  const isEdit = !!initial;
  const initType = roomTypes.find((t) => t.id === initial?.roomType?.id);
  const [num, setNum] = React.useState(initial?.room_number ?? "");
  const [floorId, setFloorId] = React.useState(initial?.floor_id ?? initial?.floor?.id ?? floors[0]?.id ?? "");
  const [typeId, setTypeId] = React.useState(initial?.roomType?.id ?? "");
  const [capacity, setCapacity] = React.useState<string>(String(initial?.capacity ?? initType?.capacity ?? 1));
  const [basePrice, setBasePrice] = React.useState<string>(initial?.base_price != null ? String(initial.base_price) : initType ? String(initType.base_price) : "");
  const [status, setStatus] = React.useState<string>(initial?.status ?? "available");
  const [override, setOverride] = React.useState(initial?.has_custom_amenities ?? false);
  const [selected, setSelected] = React.useState<string[]>(initial?.amenities?.map((a) => a.id) ?? []);

  // Picking a type is optional — it's just a label/preset. When chosen, prefill
  // capacity + base price as a convenience (the room owns the final values).
  const onTypeChange = (id: string) => {
    setTypeId(id);
    const t = roomTypes.find((x) => x.id === id);
    if (t) { setCapacity(String(t.capacity)); setBasePrice(String(t.base_price)); }
  };
  const [files, setFiles] = React.useState<File[]>([]);
  const [existing, setExisting] = React.useState<RoomTypeImage[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [imgBusy, setImgBusy] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // Load already-uploaded images when editing.
  React.useEffect(() => {
    if (initial?.id) roomsApi.images(initial.id).then(setExisting).catch(() => {});
  }, [initial?.id]);
  const reloadImages = async () => { if (initial?.id) { try { setExisting(await roomsApi.images(initial.id)); } catch { /* ignore */ } } };

  const type = roomTypes.find((t) => t.id === typeId);
  const floor = floors.find((f) => f.id === floorId);
  const capNum = Number(capacity) || 0;
  const baseNum = Number(basePrice) || 0;
  const shownAmenities = override ? amenities.filter((a) => selected.includes(a.id)) : (type?.amenities ?? []);
  const addons = shownAmenities.reduce((sum, a) => sum + Number(a.price), 0);
  const total = baseNum + addons;

  const previews = React.useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  React.useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  const totalPhotos = existing.length + files.length;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, Math.max(0, 8 - existing.length)));
  };

  const deleteExisting = async (img: RoomTypeImage) => {
    if (!initial?.id) return;
    setImgBusy(img.id);
    try { await roomsApi.deleteImage(initial.id, img.id); await reloadImages(); toast.success("Photo removed"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setImgBusy(null); }
  };
  const makePrimary = async (img: RoomTypeImage) => {
    if (!initial?.id) return;
    setImgBusy(img.id);
    try { await roomsApi.setPrimaryImage(initial.id, img.id); await reloadImages(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setImgBusy(null); }
  };

  // Preview hero: existing primary → first existing → first new file.
  const heroUrl = existing.find((i) => i.is_primary)?.image_url ?? existing[0]?.image_url ?? previews[0] ?? null;

  const submit = async () => {
    if (!num.trim()) return toast.error("Enter a room number.");
    if (!floorId) return toast.error("Select a floor.");
    if (capNum < 1) return toast.error("Capacity must be at least 1.");
    if (baseNum <= 0) return toast.error("Enter a base price.");
    setBusy(true);
    try {
      let roomId = initial?.id;
      const payload = {
        room_number: num.trim(), floor_id: floorId, room_type_id: typeId || undefined,
        capacity: capNum, base_price: baseNum, status, amenity_ids: override ? selected : undefined,
      };
      if (isEdit && initial) {
        await roomsApi.updateRoom(initial.id, payload);
      } else {
        const room = await roomsApi.createRoom(payload);
        roomId = room?.id;
      }
      if (files.length && roomId) {
        try { await roomsApi.uploadImages(roomId, files); }
        catch { toast.warning("Saved, but image upload failed — try again from the room page."); }
      }
      toast.success(isEdit ? "Room updated" : "Room created");
      await refetch();
      onDone();
    } catch (err) {
      const e = err as { message: string; errors?: { message: string }[] };
      toast.error(e.errors?.[0]?.message || e.message || "Could not save room");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Form ── */}
        <div className="space-y-4">
          <p className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">{isEdit ? `Edit room ${initial?.room_number ?? ""}` : "New room"}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label>Room number</Label><Input value={num} onChange={setInput(setNum)} placeholder="A-204" /></div>
            <div className="space-y-2"><Label>Status</Label>
              <SimpleSelect value={status} onChange={setStatus} className="w-full"
                options={[{ value: "available", label: "Available" }, { value: "occupied", label: "Occupied" }, { value: "maintenance", label: "Maintenance" }, { value: "reserved", label: "Reserved" }]} />
            </div>
            <div className="space-y-2"><Label>Floor</Label>
              <SimpleSelect value={floorId} onChange={setFloorId} className="w-full"
                options={floors.map((f) => ({ value: f.id, label: `${f.block?.name ?? "Block"} · Floor ${f.floor_number}` }))} />
            </div>
            <div className="space-y-2"><Label>Room type <span className="text-muted-foreground">(optional label)</span></Label>
              <SimpleSelect value={typeId} onChange={onTypeChange} className="w-full" placeholder="No type"
                options={[{ value: "", label: "No type" }, ...roomTypes.map((t) => ({ value: t.id, label: `${t.name} · ${money(t.total_price ?? t.base_price)}` }))]} />
            </div>
            <div className="space-y-2"><Label>Capacity (beds)</Label>
              <Input type="number" min={1} value={capacity} onChange={setInput(setCapacity)} placeholder="2" />
            </div>
            <div className="space-y-2"><Label>Base price (₨ / month)</Label>
              <Input type="number" min={0} value={basePrice} onChange={setInput(setBasePrice)} placeholder="12000" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Picking a type pre-fills capacity &amp; price — but this room owns the final values.
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} className="size-4 accent-gold" />
              Override amenities for this room (otherwise inherits the type&apos;s)
            </label>
            {override && <AmenityPicker amenities={amenities} selected={selected} onToggle={toggle} />}
          </div>

          {/* Images — existing (editable) + newly chosen */}
          <div className="space-y-2">
            <Label>Photos <span className="text-muted-foreground">({totalPhotos}/8)</span></Label>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); if (fileRef.current) fileRef.current.value = ""; }} />
            <div className="flex flex-wrap gap-2">
              {existing.map((img) => (
                <div key={img.id} className={`group relative size-16 overflow-hidden rounded-lg border ${img.is_primary ? "border-gold ring-1 ring-gold/40" : "border-border"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt="" className="size-full object-cover" />
                  {img.is_primary && <span className="absolute left-0.5 top-0.5 rounded bg-gold px-1 text-[9px] font-semibold text-gold-foreground">★</span>}
                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    {!img.is_primary && <button type="button" title="Set primary" disabled={imgBusy === img.id} onClick={() => makePrimary(img)} className="rounded bg-white/90 px-1 text-[10px] font-medium text-black">★</button>}
                    <button type="button" title="Delete" disabled={imgBusy === img.id} onClick={() => deleteExisting(img)} className="rounded bg-white/90 p-0.5 text-destructive"><Trash2 className="size-3" /></button>
                  </div>
                </div>
              ))}
              {previews.map((src, i) => (
                <div key={src} className="relative size-16 overflow-hidden rounded-lg border border-dashed border-gold/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="size-full object-cover" />
                  <span className="absolute left-0.5 top-0.5 rounded bg-gold/80 px-1 text-[9px] font-semibold text-gold-foreground">new</span>
                  <button type="button" onClick={() => setFiles((f) => f.filter((_, idx) => idx !== i))}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"><X className="size-3" /></button>
                </div>
              ))}
              {totalPhotos < 8 && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex size-16 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-gold/50">
                  <Upload className="size-4" /><span className="text-[10px]">Add</span>
                </button>
              )}
            </div>
            {isEdit && <p className="text-[11px] text-muted-foreground">Hover a photo to set it as primary or remove it. New photos upload when you save.</p>}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            <Button type="button" size="sm" onClick={submit} disabled={busy}>{isEdit ? "Save changes" : "Create room"}</Button>
          </div>
        </div>

        {/* ── Live preview ── */}
        <div className="lg:border-l lg:border-border/60 lg:pl-5">
          <p className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">Live preview</p>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-gold/10">
              {heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-gold/40"><ImageIcon className="size-10" /></div>
              )}
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium backdrop-blur"><StatusBadge status={status} /></span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-base font-semibold">Room {num || "—"}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="size-3.5" /> {floor?.block?.name ?? "Block"}{floor ? ` · Floor ${floor.floor_number}` : ""}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"><Users className="size-3" /> {sharing(capNum)}</span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><BedDouble className="size-3.5" /> {type?.name ?? "Room type"}</p>
              {shownAmenities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {shownAmenities.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1 rounded-md bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold"><Check className="size-3" /> {a.name}</span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-end justify-between border-t border-border/50 pt-3">
                <div>
                  <p className="font-heading text-2xl font-semibold">{money(total)}</p>
                  <p className="text-xs text-muted-foreground">per term · all-inclusive</p>
                </div>
                {addons > 0 && <p className="text-right text-xs text-muted-foreground">base {money(basePrice)}<br />+ add-ons {money(addons)}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return <SkeletonGrid count={6} />;
}
