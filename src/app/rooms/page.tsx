"use client";

import * as React from "react";
import Link from "next/link";
import {
  BedDouble,
  Building2,
  Check,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SimpleSelect from "@/components/ui/simple-select";
import { SkeletonGrid } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePublicRooms, type PublicRoom } from "@/lib/features/public";

const money = (v: string | number) => `₨ ${Number(v).toLocaleString()}`;
const sharing = (cap: number) => (cap <= 1 ? "Private room" : `Sharing for ${cap}`);
const isAvailable = (r: PublicRoom) => r.available;

type SortKey = "price_asc" | "price_desc" | "capacity_asc" | "capacity_desc";

const SORT_OPTIONS = [
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "capacity_asc", label: "Occupancy: low to high" },
  { value: "capacity_desc", label: "Occupancy: high to low" },
];

export default function RoomsBrowsePage() {
  const { rooms, loading } = usePublicRooms();

  const [q, setQ] = React.useState("");
  const [block, setBlock] = React.useState("");
  const [capacity, setCapacity] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [onlyAvailable, setOnlyAvailable] = React.useState(false);
  const [sort, setSort] = React.useState<SortKey>("price_asc");

  // Derive filter option lists from the catalogue.
  const blocks = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rooms) if (r.block) m.set(r.block.id, r.block.name);
    return [...m.entries()];
  }, [rooms]);
  const capacities = React.useMemo(
    () => [...new Set(rooms.map((r) => r.capacity).filter(Boolean))].sort((a, b) => a - b),
    [rooms],
  );
  const priceCeiling = React.useMemo(
    () => Math.max(0, ...rooms.map((r) => Number(r.total_price))),
    [rooms],
  );

  const filtered = React.useMemo(() => {
    let list = rooms.slice();
    const term = q.trim().toLowerCase();
    if (term)
      list = list.filter(
        (r) =>
          r.room_number.toLowerCase().includes(term) ||
          r.block?.name?.toLowerCase().includes(term) ||
          r.roomType?.name?.toLowerCase().includes(term) ||
          r.amenities?.some((a) => a.name.toLowerCase().includes(term)),
      );
    if (block) list = list.filter((r) => r.block?.id === block);
    if (capacity) list = list.filter((r) => r.capacity === Number(capacity));
    if (maxPrice) list = list.filter((r) => Number(r.total_price) <= Number(maxPrice));
    if (onlyAvailable) list = list.filter(isAvailable);
    const bySort = (a: PublicRoom, b: PublicRoom) => {
      switch (sort) {
        case "price_desc":
          return Number(b.total_price) - Number(a.total_price);
        case "capacity_asc":
          return a.capacity - b.capacity;
        case "capacity_desc":
          return b.capacity - a.capacity;
        default:
          return Number(a.total_price) - Number(b.total_price);
      }
    };
    // Bookable rooms first, then apply the chosen sort within each group.
    list.sort((a, b) => {
      const av = Number(isAvailable(b)) - Number(isAvailable(a));
      return av !== 0 ? av : bySort(a, b);
    });
    return list;
  }, [rooms, q, block, capacity, maxPrice, onlyAvailable, sort]);

  const resetFilters = () => {
    setQ("");
    setBlock("");
    setCapacity("");
    setMaxPrice("");
    setOnlyAvailable(false);
    setSort("price_asc");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost">
              Resident login
            </ButtonLink>
            <ButtonLink href="/apply" className="shadow-sm">
              Apply now
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
            <Sparkles className="size-3.5" /> Find your second home
          </span>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Browse rooms
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every room is all-inclusive — pick the one that fits and apply in minutes. Your selection
            carries straight into your application.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-heading text-sm font-semibold">Filters</p>
                <button
                  onClick={resetFilters}
                  className="text-xs font-medium text-gold underline-offset-4 hover:underline"
                >
                  Reset
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Room, block, amenity…"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Block</Label>
                  <SimpleSelect
                    className="w-full"
                    value={block}
                    onChange={setBlock}
                    options={[{ value: "", label: "All blocks" }, ...blocks.map(([id, name]) => ({ value: id, label: name }))]}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Occupancy</Label>
                  <SimpleSelect
                    className="w-full"
                    value={capacity}
                    onChange={setCapacity}
                    options={[{ value: "", label: "Any occupancy" }, ...capacities.map((c) => ({ value: String(c), label: sharing(c) }))]}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="maxPrice">
                    Max price {maxPrice ? `· ${money(maxPrice)}` : ""}
                  </Label>
                  <input
                    id="maxPrice"
                    type="range"
                    min={0}
                    max={priceCeiling || 30000}
                    step={500}
                    value={maxPrice || priceCeiling || 30000}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full accent-gold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Up to {money(maxPrice || priceCeiling || 0)} / month
                  </p>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="size-4 accent-gold"
                  />
                  Available rooms only
                </label>

                <div className="space-y-1.5">
                  <Label>Sort by</Label>
                  <SimpleSelect
                    className="w-full"
                    value={sort}
                    onChange={(v) => setSort(v as SortKey)}
                    options={SORT_OPTIONS}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <section>
            <p className="mb-4 text-sm text-muted-foreground">
              {loading ? "Loading rooms…" : `${filtered.length} room${filtered.length === 1 ? "" : "s"} found`}
            </p>

            {loading ? (
              <SkeletonGrid count={6} />
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
                <BedDouble className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 font-medium">No rooms match your filters</p>
                <p className="mt-1 text-sm text-muted-foreground">Try widening your price range or clearing filters.</p>
                <Button variant="outline" className="mt-4" onClick={resetFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((r) => (
                  <RoomCard key={r.id} room={r} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function RoomCard({ room }: { room: PublicRoom }) {
  const available = isAvailable(room);
  const img = room.images?.[0]?.image_url;

  return (
    <div className={cn(
      "group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
      !available && "opacity-75",
    )}>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={room.room_number} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <BedDouble className="size-12 text-muted-foreground/30" />
          </div>
        )}
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur",
            available ? "bg-success/90 text-white" : "bg-muted-foreground/80 text-white",
          )}
        >
          {available ? "Available" : "Fully booked"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-heading text-base font-semibold">Room {room.room_number}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="size-3.5" />
              {room.block?.name ?? "Hostel"}
              {room.roomType?.name ? ` · ${room.roomType.name}` : ""}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
            <Users className="size-3" /> {sharing(room.capacity)}
          </span>
        </div>

        {/* Amenities */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {room.amenities.slice(0, 4).map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 rounded-md bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold"
              >
                <Check className="size-3" /> {a.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-heading text-2xl font-semibold">{money(room.total_price)}</p>
              <p className="text-xs text-muted-foreground">per month · all-inclusive</p>
            </div>
          </div>
          <ButtonLink
            href={`/apply?room=${room.id}`}
            className={cn("mt-4 w-full", !available && "pointer-events-none opacity-50")}
          >
            {available ? "Book this room" : "Unavailable"}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
