"use client";

import * as React from "react";
import {
  BedDouble,
  Wallet,
  CalendarCheck,
  Footprints,
  FileDown,
  FileText,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Stats } from "@/components/ui/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SimpleSelect from "@/components/ui/simple-select";
import { FunnelChart, type FunnelStage } from "@/components/ui/funnel-chart";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { FeeDonut } from "@/components/dashboard/charts";
import {
  useOverview,
  useFeeDashboard,
  useSupportDashboard,
  useReports,
  useKpis,
  REPORT_TYPES,
  type ReportType,
  type ExportFormat,
} from "@/lib/features/reports";

const money = (v?: number) => `₨ ${Number(v ?? 0).toLocaleString()}`;

// Modules that expose KPI rows (free-text on the backend; these are the seeded ones).
const KPI_MODULES = ["occupancy", "revenue", "attendance", "visitor", "support"] as const;

export default function AdminReports() {
  return (
    <>
      <PageHeader title="Reports & analytics" description="Live cross-module insights for the whole hostel." />
      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="generated">Generated reports</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-4">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="generated" className="space-y-4">
          <GeneratedTab />
        </TabsContent>
        <TabsContent value="kpis" className="space-y-4">
          <KpiTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

function DashboardTab() {
  const { overview, loading } = useOverview();
  const { fees } = useFeeDashboard();
  const { support } = useSupportDashboard();

  const occ = overview?.occupancy;
  const rev = overview?.revenue;
  const att = overview?.attendance;
  const vis = overview?.visitor;

  const feeDonut = [
    { name: "Collected", value: Math.round(fees?.total_collected ?? 0), fill: "var(--chart-1)" },
    { name: "Pending", value: Math.round(fees?.total_pending ?? 0), fill: "var(--chart-2)" },
    { name: "Overdue", value: Math.round(fees?.total_overdue ?? 0), fill: "var(--chart-3)" },
  ].filter((d) => d.value > 0);

  // Support tickets as a resolution funnel: raised → picked up → resolved.
  const pickedUp = (support?.in_progress ?? 0) + (support?.resolved ?? 0);
  const supportFunnel: FunnelStage[] = [
    { label: "Raised", value: support?.total ?? 0, color: "var(--chart-1)" },
    { label: "Picked up", value: pickedUp, color: "var(--chart-2)" },
    { label: "Resolved", value: support?.resolved ?? 0, color: "var(--chart-3)" },
  ];
  const hasFunnel = (support?.total ?? 0) > 0;

  return (
    <>
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      <Stats
        items={[
          { label: "Occupancy", value: `${Math.round(occ?.occupancy_rate ?? 0)}%`, subtext: `${occ?.occupied_rooms ?? 0} / ${occ?.total_rooms ?? 0} rooms`, icon: BedDouble, highlight: true, loading },
          { label: "Collection", value: `${Math.round(rev?.collection_rate ?? 0)}%`, subtext: money(rev?.collected), icon: Wallet, loading },
          { label: "Attendance", value: `${Math.round(att?.attendance_rate ?? 0)}%`, subtext: `${att?.present ?? 0} present marks`, icon: CalendarCheck, loading },
          { label: "Visitors", value: String(vis?.total_visitors ?? 0), subtext: `${vis?.currently_inside ?? 0} inside now`, icon: Footprints, loading },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue mix</CardTitle>
            <CardDescription>Collected vs pending vs overdue (₨)</CardDescription>
          </CardHeader>
          <CardContent>
            {feeDonut.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No fee data yet.</p>
            ) : (
              <>
                <FeeDonut data={feeDonut} />
                <div className="mt-4 space-y-2">
                  {feeDonut.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 rounded-full" style={{ background: d.fill }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="ml-auto font-medium">{money(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rates</CardTitle>
            <CardDescription>Key performance ratios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {[
              { label: "Occupancy", value: occ?.occupancy_rate ?? 0 },
              { label: "Fee collection", value: rev?.collection_rate ?? 0 },
              { label: "Attendance", value: att?.attendance_rate ?? 0 },
              { label: "Visitor checkout", value: vis?.checkout_rate ?? 0 },
            ].map((r) => (
              <div key={r.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-medium">{Math.round(r.value)}%</span>
                </div>
                <Progress value={r.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support tickets</CardTitle>
          <CardDescription>Help desk status across the hostel</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Open" value={String(support?.open ?? 0)} />
          <StatCard label="In progress" value={String(support?.in_progress ?? 0)} />
          <StatCard label="Resolved" value={String(support?.resolved ?? 0)} />
          <StatCard label="Total" value={String(support?.total ?? 0)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support resolution funnel</CardTitle>
          <CardDescription>How tickets flow from raised to resolved</CardDescription>
        </CardHeader>
        <CardContent>
          {hasFunnel ? (
            <FunnelChart data={supportFunnel} className="h-56 w-full" showPercentage showValues />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No support tickets yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ── Generated reports: create, list, export, delete ──

function GeneratedTab() {
  const r = useReports();
  const { reports, loading, error, busy, exportingId } = r;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Generated reports</CardTitle>
            <CardDescription>Snapshot reports you can export as PDF or CSV.</CardDescription>
          </div>
          <GenerateDialog busy={busy} onGenerate={r.generate} />
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
          )}
          {loading ? (
            <SkeletonTable cols={4} />
          ) : reports.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No reports generated yet — generate one to export.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((rep) => {
                  const when = rep.generated_at ?? rep.created_at;
                  const exporting = exportingId === rep.id;
                  return (
                    <TableRow key={rep.id}>
                      <TableCell><Badge variant="secondary" className="capitalize">{rep.report_type}</Badge></TableCell>
                      <TableCell className="font-medium">{rep.title ?? `${rep.report_type} report`}</TableCell>
                      <TableCell className="text-muted-foreground">{when ? new Date(when).toLocaleString() : "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" disabled={exporting} onClick={() => r.exportReport(rep.id, "pdf" as ExportFormat)}>
                            <FileText className="size-4" /> PDF
                          </Button>
                          <Button variant="outline" size="sm" disabled={exporting} onClick={() => r.exportReport(rep.id, "csv" as ExportFormat)}>
                            <FileDown className="size-4" /> CSV
                          </Button>
                          <Button variant="ghost" size="sm" disabled={busy} onClick={() => r.remove(rep.id)} aria-label="Delete report">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function GenerateDialog({
  busy,
  onGenerate,
}: {
  busy: boolean;
  onGenerate: (b: { report_type: ReportType; filters?: Record<string, unknown> }) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<ReportType>("overview");
  const [timeWindow, setTimeWindow] = React.useState("30");

  const submit = async () => {
    const days = parseInt(timeWindow, 10);
    const filters = Number.isFinite(days) && days > 0 ? { timeWindow: days } : {};
    const ok = await onGenerate({ report_type: type, filters });
    if (ok) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}><Plus className="size-4" /> Generate report</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate a report</DialogTitle>
          <DialogDescription>Pick a module and a time window. The report is saved and can be exported.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Report type</Label>
            <SimpleSelect
              value={type}
              onChange={(v) => setType(v as ReportType)}
              className="w-full"
              options={REPORT_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rep-window">Time window (days)</Label>
            <Input id="rep-window" type="number" min={1} value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)} placeholder="30" />
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={busy} onClick={submit}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── KPIs for a selected module ──

function KpiTab() {
  const [module, setModule] = React.useState<string>(KPI_MODULES[0]);
  const { kpis, loading, error } = useKpis(module);

  const trendIcon = (t: "up" | "down" | "stable") =>
    t === "up" ? <ArrowUp className="size-4 text-emerald-500" /> : t === "down" ? <ArrowDown className="size-4 text-destructive" /> : <Minus className="size-4 text-muted-foreground" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Module KPIs</CardTitle>
          <CardDescription>Tracked metrics with current value vs target.</CardDescription>
        </div>
        <SimpleSelect
          value={module}
          onChange={setModule}
          options={KPI_MODULES.map((m) => ({ value: m, label: m }))}
        />
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
        )}
        {loading ? (
          <SkeletonTable cols={4} />
        ) : kpis.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No KPIs tracked for this module yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpis.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.metric_name}{k.unit ? ` (${k.unit})` : ""}</TableCell>
                  <TableCell className="text-right">{Number(k.current_value).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{k.target_value != null ? Number(k.target_value).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-right"><span className="inline-flex items-center justify-end gap-1 capitalize">{trendIcon(k.trend)} {k.trend}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
