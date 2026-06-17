"use client";

import * as React from "react";
import { Download, Search } from "lucide-react";
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
import { useVisitors, useVisitorReport, type VisitorReport } from "@/lib/features/visitors";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

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
            <SkeletonTable cols={6} />
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
                          Check out
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

      <VisitorReportCard />
    </>
  );
}

function VisitorReportCard() {
  const [start, setStart] = React.useState(() => isoDaysAgo(30));
  const [end, setEnd] = React.useState(() => isoDaysAgo(0));
  const { report, loading, error } = useVisitorReport(start, end);

  const days = React.useMemo(
    () =>
      report
        ? Object.entries(report.by_date).sort(([a], [b]) => a.localeCompare(b))
        : [],
    [report],
  );

  const downloadCsv = () => {
    if (!report) return;
    const rows: string[][] = [
      ["Metric", "Value"],
      ["Range start", start],
      ["Range end", end],
      ["Total visitors", String(report.total_visitors)],
      ["Checked in", String(report.checked_in)],
      ["Checked out", String(report.checked_out)],
      ["Cancelled", String(report.cancelled)],
      [],
      ["Date", "Visitors"],
      ...days.map(([date, count]) => [date, String(count)]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visitor-report_${start}_to_${end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Visitor report</CardTitle>
        <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" className="h-9" value={start} max={end} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" className="h-9" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="h-9" disabled={!report} onClick={downloadCsv}>
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {loading ? (
          <ReportSkeleton />
        ) : report ? (
          <ReportBody report={report} days={days} />
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Pick a date range to see the report.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ReportBody({ report, days }: { report: VisitorReport; days: [string, number][] }) {
  const max = days.reduce((m, [, c]) => Math.max(m, c), 0) || 1;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={String(report.total_visitors)} hint="in range" />
        <StatCard label="Checked in" value={String(report.checked_in)} hint="still active" />
        <StatCard label="Checked out" value={String(report.checked_out)} hint="completed" />
        <StatCard label="Cancelled" value={String(report.cancelled)} hint="no-shows" />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Daily breakdown</p>
        {days.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No visitors in this range.</p>
        ) : (
          <div className="space-y-2">
            {days.map(([date, count]) => (
              <div key={date} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-muted-foreground">{date}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(count / max) * 100}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right font-medium tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
