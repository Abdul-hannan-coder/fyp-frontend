"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVisitors } from "@/lib/features/visitors";

export default function WardenVisitors() {
  const { visitors, loading, error, checkout, busyId } = useVisitors("today");
  const [search, setSearch] = React.useState("");
  const [insideOnly, setInsideOnly] = React.useState(false);

  const filtered = visitors.filter(
    (v) =>
      (v.name.toLowerCase().includes(search.toLowerCase()) ||
        (v.student?.user?.full_name ?? "").toLowerCase().includes(search.toLowerCase())) &&
      (!insideOnly || v.status === "checked_in"),
  );
  const inside = visitors.filter((v) => v.status === "checked_in").length;

  return (
    <>
      <PageHeader title="Visitors" description="Today's visitor log and check-out." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Currently inside" value={String(inside)} trend="flat" hint="checked in" />
        <StatCard label="Today total" value={String(visitors.length)} hint="visitors" />
        <StatCard label="Checked out" value={String(visitors.filter((v) => v.status === "checked_out").length)} hint="left" />
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Today&apos;s visitors</CardTitle>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
              <Switch checked={insideOnly} onCheckedChange={setInsideOnly} size="sm" />
              Inside only
            </Label>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search visitor or host…" className="h-9 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No visitors logged today.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell className="text-muted-foreground">{v.student?.user?.full_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{v.room_number ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{v.purpose ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={v.status} /></TableCell>
                    <TableCell className="text-right">
                      {v.status === "checked_in" && (
                        <Button size="sm" variant="outline" disabled={busyId === v.id} onClick={() => checkout(v.id)}>
                          {busyId === v.id ? <Loader2 className="size-4 animate-spin" /> : null} Check out
                        </Button>
                      )}
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
