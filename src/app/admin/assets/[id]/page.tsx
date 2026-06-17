"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DetailBackLink, InfoCard, InfoGrid, DetailSkeleton, type InfoItem } from "@/components/dashboard/detail";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAsync } from "@/lib/useAsync";
import { assetsApi, type Asset } from "@/lib/features/assets";
import { roomsApi } from "@/lib/features/rooms";

const fmtDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};
const money = (v?: string | number | null) =>
  v == null || v === "" ? "—" : `₨ ${Number(v).toLocaleString()}`;

// Optional purchase-tracking fields the API may include on an asset record.
type AssetWithPurchase = Asset & {
  purchase_date?: string | null;
  purchase_cost?: string | number | null;
  warranty_expiry?: string | null;
  serial_number?: string | null;
};

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();

  const assetQ = useAsync(() => assetsApi.getById(id), [id], { key: `assets:${id}` });
  const historyQ = useAsync(() => assetsApi.history(id), [id], { key: `assets:${id}:history` });

  const asset = assetQ.data as AssetWithPurchase | null;
  const roomId = asset?.room_id ?? asset?.room?.id ?? null;

  const roomQ = useAsync(() => roomsApi.room(roomId!), [roomId], {
    key: roomId ? `rooms:${roomId}` : undefined,
    enabled: !!roomId,
  });

  if (assetQ.loading && !asset) return <DetailSkeleton sections={4} />;
  if (!asset) {
    return (
      <>
        <DetailBackLink href="/admin/assets" label="Back to assets" />
        <p className="py-20 text-center text-sm text-muted-foreground">Asset not found.</p>
      </>
    );
  }

  const room = roomQ.data ?? null;
  const allocations = historyQ.data?.allocations ?? [];
  const maintenance = historyQ.data?.maintenance ?? [];

  const hasPurchaseInfo =
    asset.purchase_date != null ||
    asset.purchase_cost != null ||
    asset.warranty_expiry != null ||
    asset.serial_number != null;

  const assetInfo: InfoItem[] = [
    { label: "Asset code", value: <span className="font-mono">{asset.asset_code ?? "—"}</span> },
    { label: "Name", value: asset.name },
    { label: "Category", value: asset.category?.name ?? "—" },
    { label: "Condition", value: asset.condition ?? "—" },
    { label: "Status", value: <StatusBadge status={asset.status ?? "available"} /> },
    { label: "Description", value: asset.description ?? "—" },
  ];

  const purchaseInfo: InfoItem[] = [
    { label: "Serial number", value: asset.serial_number ?? "—" },
    { label: "Purchase date", value: fmtDate(asset.purchase_date) },
    { label: "Purchase cost", value: money(asset.purchase_cost) },
    { label: "Warranty expiry", value: fmtDate(asset.warranty_expiry) },
  ];

  const roomInfo: InfoItem[] = [
    { label: "Room number", value: room?.room_number ?? asset.room?.room_number ?? "—" },
    { label: "Room type", value: room?.roomType?.name ?? "—" },
    { label: "Block", value: room?.block?.name ?? "—" },
    { label: "Floor", value: room?.floor?.floor_number != null ? `Floor ${room.floor.floor_number}` : "—" },
    { label: "Capacity", value: room?.capacity ?? "—" },
    { label: "Status", value: room ? <StatusBadge status={room.status} /> : "—" },
  ];

  return (
    <>
      <DetailBackLink href="/admin/assets" label="Back to assets" />
      <PageHeader title={asset.name} description="Asset detail — allocation and maintenance history." />

      <div className="mx-auto w-full max-w-5xl space-y-4">
        <InfoCard title="Asset">
          <InfoGrid items={assetInfo} />
        </InfoCard>

        {hasPurchaseInfo && (
          <InfoCard title="Purchase">
            <InfoGrid items={purchaseInfo} />
          </InfoCard>
        )}

        <InfoCard title="Current room" description="Room this asset is allocated to, if any.">
          {roomQ.loading && !room && roomId ? (
            <InfoGridSkeleton />
          ) : !roomId ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Not allocated to a room.</p>
          ) : (
            <InfoGrid items={roomInfo} />
          )}
        </InfoCard>

        <InfoCard title="Allocation history" description="Where this asset has been assigned.">
          {historyQ.loading && allocations.length === 0 ? (
            <InfoGridSkeleton />
          ) : allocations.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No allocations recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((al) => (
                  <TableRow key={al.id}>
                    <TableCell className="font-medium">{al.room?.room_number ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{al.allocator?.full_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(al.allocated_at)}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{al.notes ?? "—"}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={al.status ?? "active"} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </InfoCard>

        <InfoCard title="Maintenance history" description="Maintenance, damage and lost events.">
          {historyQ.loading && maintenance.length === 0 ? (
            <InfoGridSkeleton />
          ) : maintenance.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No maintenance records.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Est. cost</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenance.map((mt) => (
                  <TableRow key={mt.id}>
                    <TableCell className="font-medium capitalize">{mt.maintenance_type ?? "maintenance"}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{mt.description ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{mt.reporter?.full_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(mt.reported_at)}</TableCell>
                    <TableCell className="text-muted-foreground">{money(mt.estimated_cost)}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={mt.status ?? "reported"} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </InfoCard>
      </div>
    </>
  );
}

function InfoGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}
