"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  DoorOpen,
  Gauge,
  Layers,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton, SkeletonGrid } from "@/components/ui/skeleton";
import {
  useRoomsAdmin,
  useRoomsDashboard,
  useRoomsHierarchy,
  type HierarchyBlock,
  type HierarchyFloor,
} from "@/lib/features/rooms";
import { useAmenities } from "@/lib/features/amenities";

export default function AdminSetupOverview() {
  const s = useRoomsAdmin();
  const am = useAmenities();
  const dash = useRoomsDashboard();
  const tree = useRoomsHierarchy();

  const cards = [
    { href: "/admin/setup/amenities", icon: Sparkles, title: "Amenities", count: am.amenities.length, desc: "Priced add-ons attached to room types." },
    { href: "/admin/setup/blocks", icon: Building2, title: "Blocks", count: s.blocks.length, desc: "Residential blocks of the hostel." },
    { href: "/admin/setup/floors", icon: Layers, title: "Floors", count: s.floors.length, desc: "Floors within each block." },
    { href: "/admin/setup/rooms", icon: DoorOpen, title: "Rooms & Types", count: s.rooms.length, desc: "Create rooms with photos + amenities, and manage room types." },
  ];

  const sum = dash.dashboard?.summary;
  const occRate =
    sum == null ? "—" : `${Number(sum.occupancy_rate)}%`;
  const available = dash.dashboard?.status_breakdown.available ?? 0;
  const occupied = dash.dashboard?.status_breakdown.occupied ?? 0;

  return (
    <>
      <PageHeader title="Hostel setup" description="Build your hostel: amenities → blocks → floors → room types → rooms. Manage each from its own page." />

      {/* KPIs from /rooms/dashboard */}
      {dash.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : dash.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {dash.error}
        </div>
      ) : sum ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total rooms" value={String(sum.total_rooms)} hint="active" icon={DoorOpen} />
          <StatCard label="Available" value={String(available)} hint={`${occupied} occupied`} />
          <StatCard label="Capacity" value={String(sum.total_capacity)} hint={`${sum.total_occupancy} occupied beds`} />
          <StatCard label="Occupancy rate" value={occRate} hint="beds in use" icon={Gauge} />
        </div>
      ) : null}

      {/* Setup section links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="size-5" />
                  </div>
                  <span className="font-heading text-2xl font-semibold">{c.count}</span>
                </div>
                <CardTitle className="mt-3 flex items-center gap-1.5 text-base">
                  {c.title}
                  <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </CardTitle>
                <CardDescription>{c.desc}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>

      {/* Hierarchy from /rooms/hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property hierarchy</CardTitle>
          <CardDescription>Blocks → floors → rooms, with each room&apos;s status.</CardDescription>
        </CardHeader>
        <CardContent>
          {tree.loading ? (
            <SkeletonGrid count={6} />
          ) : tree.error ? (
            <p className="py-8 text-center text-sm text-destructive">{tree.error}</p>
          ) : tree.hierarchy.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No blocks yet — create a block to start building the hierarchy.
            </p>
          ) : (
            <div className="space-y-3">
              {tree.hierarchy.map((block) => (
                <BlockNode key={block.id} block={block} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function BlockNode({ block }: { block: HierarchyBlock }) {
  const [open, setOpen] = React.useState(true);
  const floors = block.floors ?? [];
  const roomCount = floors.reduce((n, f) => n + (f.rooms?.length ?? 0), 0);

  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2.5">
          <Building2 className="size-4 text-primary" />
          <span className="font-medium">{block.name}</span>
          <span className="text-xs text-muted-foreground">
            {floors.length} floor{floors.length === 1 ? "" : "s"} · {roomCount} room{roomCount === 1 ? "" : "s"}
          </span>
        </span>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3">
          {floors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No floors in this block.</p>
          ) : (
            floors.map((floor) => <FloorNode key={floor.id} floor={floor} />)
          )}
        </div>
      )}
    </div>
  );
}

function FloorNode({ floor }: { floor: HierarchyFloor }) {
  const rooms = floor.rooms ?? [];
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Layers className="size-3.5" />
        Floor {floor.floor_number}
        <span className="text-xs font-normal">({rooms.length})</span>
      </div>
      {rooms.length === 0 ? (
        <p className="pl-5 text-xs text-muted-foreground">No rooms on this floor.</p>
      ) : (
        <div className="grid gap-2 pl-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm">
                <DoorOpen className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{room.room_number}</span>
                {room.roomType?.name && (
                  <span className="text-xs text-muted-foreground">{room.roomType.name}</span>
                )}
              </span>
              <StatusBadge status={room.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
