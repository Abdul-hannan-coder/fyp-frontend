"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { useRoomsAdmin } from "@/lib/features/rooms";
import { useAmenities } from "@/lib/features/amenities";

const money = (v: unknown) => `₨ ${Number(v || 0).toLocaleString()}`;

export default function RoomTypeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { roomTypes, rooms, loading, busy, updateRoomType } = useRoomsAdmin();
  const { amenities } = useAmenities();

  const roomType = roomTypes.find((rt) => rt.id === id);

  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState("");
  const [capacity, setCapacity] = React.useState("");
  const [basePrice, setBasePrice] = React.useState("");
  const [bedType, setBedType] = React.useState("");
  const [sizeSqft, setSizeSqft] = React.useState("");
  const [selectedAmenities, setSelectedAmenities] = React.useState<string[]>([]);

  const openEdit = () => {
    if (!roomType) return;
    setName(roomType.name);
    setCapacity(String(roomType.capacity ?? ""));
    setBasePrice(String(roomType.base_price ?? ""));
    setBedType(roomType.bed_type ?? "");
    setSizeSqft(roomType.size_sqft != null ? String(roomType.size_sqft) : "");
    setSelectedAmenities((roomType.amenities ?? []).map((a) => a.id));
    setEditing(true);
  };

  const toggleAmenity = (amenityId: string) =>
    setSelectedAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((x) => x !== amenityId) : [...prev, amenityId],
    );

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomType) return;
    const ok = await updateRoomType(roomType.id, {
      name: name.trim(),
      capacity: Number(capacity),
      base_price: Number(basePrice),
      bed_type: bedType.trim() || undefined,
      size_sqft: sizeSqft ? Number(sizeSqft) : undefined,
      amenity_ids: selectedAmenities,
    });
    if (ok) setEditing(false);
  };

  if (loading && !roomType) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!roomType) {
    return (
      <div className="space-y-6">
        <PageHeader title="Room type not found" description="This room type may have been removed." />
        <ButtonLink variant="ghost" size="sm" href="/admin/setup/room-types">
          <ArrowLeft className="size-4" /> Back to room types
        </ButtonLink>
      </div>
    );
  }

  const typeRooms = rooms.filter((r) => r.roomType?.id === roomType.id);
  const amenitiesTotal = (roomType.amenities ?? []).reduce((sum, a) => sum + Number(a.price || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title={roomType.name} description={roomType.description || "Room type details"}>
        <ButtonLink variant="ghost" size="sm" href="/admin/setup/room-types">
          <ArrowLeft className="size-4" /> Back
        </ButtonLink>
        <Button size="sm" variant={editing ? "secondary" : "default"} onClick={() => (editing ? setEditing(false) : openEdit())} disabled={busy}>
          {editing ? <><X className="size-4" /> Cancel</> : <><Pencil className="size-4" /> Edit</>}
        </Button>
      </PageHeader>

      {editing && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Edit room type</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Standard Double" required />
                </div>
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Base price (₨ / term)</Label>
                  <Input type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Bed type</Label>
                  <Input value={bedType} onChange={(e) => setBedType(e.target.value)} placeholder="Bunk bed" />
                </div>
                <div className="space-y-2">
                  <Label>Size (sq ft)</Label>
                  <Input type="number" min={0} value={sizeSqft} onChange={(e) => setSizeSqft(e.target.value)} placeholder="120" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="flex flex-wrap gap-2">
                  {amenities.length === 0 && <p className="text-sm text-muted-foreground">No amenities available.</p>}
                  {amenities.map((a) => {
                    const active = selectedAmenities.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAmenity(a.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/40 text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {a.name} · {money(a.price)}
                      </button>
                    );
                  })}
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
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Capacity" value={`${roomType.capacity} ${roomType.capacity === 1 ? "person" : "people"}`} />
              <Field label="Bed type" value={roomType.bed_type || "—"} />
              <Field label="Size" value={roomType.size_sqft != null ? `${roomType.size_sqft} sq ft` : "—"} />
              <Field label="Total price" value={money(roomType.total_price ?? Number(roomType.base_price) + amenitiesTotal)} />
            </dl>

            {roomType.description && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                <p className="text-sm">{roomType.description}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {(roomType.amenities ?? []).length === 0 && <p className="text-sm text-muted-foreground">No amenities.</p>}
                {(roomType.amenities ?? []).map((a) => (
                  <Badge key={a.id} variant="secondary" className="font-normal">
                    {a.name} · {money(a.price)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Price breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Base price</span>
              <span className="font-medium">{money(roomType.base_price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amenities</span>
              <span className="font-medium">{money(amenitiesTotal)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="font-semibold">Total</span>
              <span className="font-semibold text-primary">
                {money(roomType.total_price ?? Number(roomType.base_price) + amenitiesTotal)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Rooms of this type ({typeRooms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {typeRooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rooms assigned to this room type yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {typeRooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/admin/setup/rooms/${room.id}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-accent"
                >
                  <span className="font-medium">Room {room.room_number}</span>
                  <StatusBadge status={room.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
