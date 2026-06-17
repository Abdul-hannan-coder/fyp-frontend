"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ClipboardCheck, ImagePlus, Pencil, Plus, Star, Trash2, Upload, Wrench, X } from "lucide-react";
import { Skeleton, SkeletonCards, SkeletonGrid } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { useAsync } from "@/lib/useAsync";
import {
  roomsApi,
  useInspections,
  type Room,
  type RoomType,
  type RoomTypeImage,
  type InspectionInput,
} from "@/lib/features/rooms";

const money = (v: unknown) => `₨ ${Number(v || 0).toLocaleString()}`;

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "maintenance", label: "Maintenance" },
  { value: "reserved", label: "Reserved" },
];

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const roomQ = useAsync<Room>(() => roomsApi.room(id), [id]);
  const typesQ = useAsync<RoomType[]>(() => roomsApi.roomTypes(), []);
  const imagesQ = useAsync<RoomTypeImage[]>(() => roomsApi.images(id), [id]);

  const room = roomQ.data;

  if (roomQ.loading && !room) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="space-y-6">
        <PageHeader title="Room not found" description="This room may have been removed." />
        <ButtonLink variant="ghost" size="sm" href="/admin/setup/rooms">
          <ArrowLeft className="size-4" /> Back to rooms
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Room ${room.room_number}`}
        description={[room.block?.name, room.floor ? `Floor ${room.floor.floor_number}` : null, room.roomType?.name]
          .filter(Boolean)
          .join(" · ") || "Room details"}
      >
        <ButtonLink variant="ghost" size="sm" href="/admin/setup/rooms">
          <ArrowLeft className="size-4" /> Back
        </ButtonLink>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Details column ── */}
        <div className="space-y-6 lg:col-span-2">
          <OverviewCard room={room} roomTypes={typesQ.data ?? []} onSaved={() => roomQ.refetch()} />
          <InspectionsCard roomId={id} onLogged={() => roomQ.refetch()} />
        </div>

        {/* ── Side column ── */}
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Price breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Base price" value={money(room.base_price ?? room.roomType?.base_price)} />
              <Row label="Amenities" value={money(room.amenities_price)} />
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-semibold">Total / term</span>
                <span className="font-heading text-lg font-semibold text-primary">{money(room.total_price)}</span>
              </div>
            </CardContent>
          </Card>

          <ImageGallery
            roomId={id}
            images={imagesQ.data ?? []}
            loading={imagesQ.loading}
            onChanged={() => imagesQ.refetch()}
          />
        </div>
      </div>
    </div>
  );
}

// ── Overview card: view by default, pencil → inline edit ──────────────────
function OverviewCard({ room, roomTypes, onSaved }: { room: Room; roomTypes: RoomType[]; onSaved: () => void }) {
  const [editing, setEditing] = React.useState(false);
  const [num, setNum] = React.useState(room.room_number);
  const [typeId, setTypeId] = React.useState(room.roomType?.id ?? "");
  const [status, setStatus] = React.useState(room.status);
  const [capacity, setCapacity] = React.useState(String(room.capacity ?? room.roomType?.capacity ?? 1));
  const [basePrice, setBasePrice] = React.useState(room.base_price != null ? String(room.base_price) : "");
  const [notes, setNotes] = React.useState(room.notes ?? "");
  const [busy, setBusy] = React.useState(false);

  const open = () => {
    setNum(room.room_number);
    setTypeId(room.roomType?.id ?? "");
    setStatus(room.status);
    setCapacity(String(room.capacity ?? room.roomType?.capacity ?? 1));
    setBasePrice(room.base_price != null ? String(room.base_price) : "");
    setNotes(room.notes ?? "");
    setEditing(true);
  };

  const onTypeChange = (id: string) => {
    setTypeId(id);
    const t = roomTypes.find((x) => x.id === id);
    if (t) { setCapacity(String(t.capacity)); setBasePrice(String(t.base_price)); }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await roomsApi.updateRoom(room.id, {
        room_number: num.trim(),
        room_type_id: typeId || undefined,
        status,
        capacity: Number(capacity) || 1,
        base_price: Number(basePrice) || 0,
        notes: notes.trim() || undefined,
      });
      toast.success("Room updated");
      onSaved();
      setEditing(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const capNum = room.capacity ?? room.roomType?.capacity ?? 0;
  const occupancy = room.current_occupancy ?? 0;
  const effective = room.effective_amenities ?? room.amenities ?? [];

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Status, type and pricing for this room.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {!editing && <StatusBadge status={room.status} />}
          <Button size="icon-sm" variant={editing ? "secondary" : "outline"} title={editing ? "Cancel" : "Edit"} onClick={() => (editing ? setEditing(false) : open())} disabled={busy}>
            {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
          </Button>
        </div>
      </CardHeader>

      {editing ? (
        <CardContent>
          <form onSubmit={onSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Room number</Label>
                <Input value={num} onChange={(e) => setNum(e.target.value)} placeholder="A-204" required />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <SimpleSelect value={status} onChange={(v) => setStatus(v as Room["status"])} className="w-full" options={STATUS_OPTIONS} />
              </div>
              <div className="space-y-2">
                <Label>Room type <span className="text-muted-foreground">(optional)</span></Label>
                <SimpleSelect
                  value={typeId}
                  onChange={onTypeChange}
                  className="w-full"
                  placeholder="No type"
                  options={[{ value: "", label: "No type" }, ...roomTypes.map((t) => ({ value: t.id, label: `${t.name}${t.total_price ? ` · ${money(t.total_price)}` : ""}` }))]}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity (beds)</Label>
                <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Base price (₨ / month)</Label>
                <Input type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Recently renovated, near the stairwell…" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={busy}>
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      ) : (
        <CardContent className="space-y-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Room number" value={room.room_number} />
            <Field label="Room type" value={room.roomType?.name ?? "—"} />
            <Field label="Block" value={room.block?.name ?? "—"} />
            <Field label="Floor" value={room.floor ? `Floor ${room.floor.floor_number}` : "—"} />
            <Field label="Occupancy" value={`${occupancy} / ${capNum} ${capNum === 1 ? "bed" : "beds"}`} />
            <Field label="Custom amenities" value={room.has_custom_amenities ? "Yes" : "Inherited from type"} />
          </dl>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {effective.length === 0 ? (
                <p className="text-sm text-muted-foreground">No amenities.</p>
              ) : (
                effective.map((a) => (
                  <Badge key={a.id} variant="secondary" className="font-normal">
                    {a.name} · {money(a.price)}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {room.notes && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="text-sm">{room.notes}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── Image gallery ────────────────────────────────────────────────────────
function ImageGallery({
  roomId,
  images,
  loading,
  onChanged,
}: {
  roomId: string;
  images: RoomTypeImage[];
  loading: boolean;
  onChanged: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<RoomTypeImage | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const upload = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    setUploading(true);
    try {
      await roomsApi.uploadImages(roomId, imgs);
      toast.success(`Uploaded ${imgs.length} image${imgs.length === 1 ? "" : "s"}`);
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const onSetPrimary = async (img: RoomTypeImage) => {
    setBusyId(img.id);
    try {
      await roomsApi.setPrimaryImage(roomId, img.id);
      toast.success("Primary image set");
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (img: RoomTypeImage) => {
    setBusyId(img.id);
    try {
      await roomsApi.deleteImage(roomId, img.id);
      toast.success("Image deleted");
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
      setDeleting(null);
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Photos</CardTitle>
          <CardDescription>{images.length} {images.length === 1 ? "image" : "images"}</CardDescription>
        </div>
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <ImagePlus className="size-4" /> Upload
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void upload(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />

        {loading ? (
          <SkeletonGrid count={6} />
        ) : images.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); void upload(Array.from(e.dataTransfer.files)); }}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center text-sm transition-colors ${
              dragOver ? "border-gold bg-gold/10 text-foreground" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Upload className="size-6" />
            <span>Drop images here or click to upload</span>
            <span className="text-xs">PNG, JPG up to a few MB each</span>
          </button>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); void upload(Array.from(e.dataTransfer.files)); }}
            className={`grid grid-cols-2 gap-3 rounded-xl transition-colors ${dragOver ? "ring-2 ring-gold ring-offset-2" : ""}`}
          >
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt="Room" className="size-full object-cover" />
                {img.is_primary && (
                  <Badge className="absolute left-2 top-2 gap-1 bg-gold text-gold-foreground">
                    <Star className="size-3 fill-current" /> Primary
                  </Badge>
                )}
                <div className="absolute inset-0 flex items-end justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {!img.is_primary && (
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      title="Set primary"
                      disabled={busyId === img.id}
                      onClick={() => onSetPrimary(img)}
                    >
                      <Star className="size-4" />
                    </Button>
                  )}
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    title="Delete"
                    disabled={busyId === img.id}
                    onClick={() => setDeleting(img)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete image"
        description="This image will be permanently removed from the room."
        confirmLabel="Delete"
        destructive
        busy={busyId !== null && busyId === deleting?.id}
        onConfirm={() => deleting && onDelete(deleting)}
      />
    </Card>
  );
}

// ── Inspections ───────────────────────────────────────────────────────────
function InspectionsCard({ roomId, onLogged }: { roomId: string; onLogged: () => void }) {
  const insp = useInspections(roomId);

  const handleLogged = async (b: InspectionInput) => {
    const ok = await insp.create(b);
    if (ok) onLogged();
    return ok;
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Inspections</CardTitle>
          <CardDescription>Condition checks logged for this room.</CardDescription>
        </div>
        <LogInspectionDialog busy={insp.busy} onSubmit={handleLogged} />
      </CardHeader>
      <CardContent>
        {insp.error && (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{insp.error}</div>
        )}
        {insp.loading ? (
          <SkeletonCards count={4} />
        ) : insp.inspections.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No inspections logged yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {insp.inspections.map((x) => (
              <li key={x.id} className="rounded-xl border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-medium">
                    <ClipboardCheck className="size-4 text-muted-foreground" />
                    {fmtDate(x.inspected_at)}
                  </span>
                  <span className="flex items-center gap-2">
                    {x.maintenance_required && (
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <Wrench className="size-3" /> Maintenance
                      </Badge>
                    )}
                    <Badge variant="outline" className="font-normal">
                      {ratingLabel(x.condition_rating)} ({x.condition_rating ?? "—"}/5)
                    </Badge>
                  </span>
                </div>
                {x.condition_notes && <p className="mt-2 text-muted-foreground">{x.condition_notes}</p>}
                {x.inspector?.full_name && (
                  <p className="mt-1 text-xs text-muted-foreground">by {x.inspector.full_name}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const RATING_OPTIONS = [
  { value: "5", label: "5 — Excellent" },
  { value: "4", label: "4 — Good" },
  { value: "3", label: "3 — Fair" },
  { value: "2", label: "2 — Poor" },
  { value: "1", label: "1 — Critical" },
];

function ratingLabel(r?: number) {
  const map: Record<number, string> = { 5: "Excellent", 4: "Good", 3: "Fair", 2: "Poor", 1: "Critical" };
  return r ? map[r] ?? "—" : "—";
}

function LogInspectionDialog({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (b: InspectionInput) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState("4");
  const [date, setDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [maintenance, setMaintenance] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setRating("4");
      setDate("");
      setNotes("");
      setMaintenance(false);
    }
  }, [open]);

  const submit = async () => {
    const ok = await onSubmit({
      condition_rating: Number(rating),
      inspected_at: date ? new Date(date).toISOString() : undefined,
      condition_notes: notes.trim() || undefined,
      maintenance_required: maintenance,
    });
    if (ok) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" /> Log inspection
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log inspection</DialogTitle>
          <DialogDescription>Record a condition check for this room.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Condition rating</Label>
              <SimpleSelect value={rating} onChange={setRating} className="w-full" options={RATING_OPTIONS} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="insp-date">Inspected on</Label>
              <Input id="insp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="insp-notes">Notes</Label>
            <Textarea id="insp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any observations…" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              className="size-4 accent-primary"
            />
            Maintenance required
          </label>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={busy} onClick={submit}>
            Log inspection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function fmtDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
