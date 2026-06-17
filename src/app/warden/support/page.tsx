"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResponsiveTabs } from "@/components/ui/responsive-tabs";
import { SingleSelect } from "@/components/ui/single-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TicketDetailDialog } from "@/components/dialogs/ticket-detail-dialog";
import { useSupport, type Ticket } from "@/lib/features/support";
import { SkeletonTable } from "@/components/ui/skeleton";

const priorityColor: Record<string, string> = {
  high: "bg-destructive/12 text-destructive border-destructive/25",
  medium: "bg-warning/15 text-gold-foreground border-warning/30",
  low: "bg-muted text-muted-foreground",
};

export default function WardenSupport() {
  const { tickets, loading, error, setStatus, assign, busyId } = useSupport("all");
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState("open");
  const [priority, setPriority] = React.useState("");
  const [selected, setSelected] = React.useState<Ticket | null>(null);
  const [assigning, setAssigning] = React.useState<Ticket | null>(null);

  const confirmAssign = async () => {
    if (!assigning) return;
    const ok = await assign(assigning.id);
    if (ok) setAssigning(null);
  };

  const match = (t: Ticket) =>
    (t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.student?.user?.full_name ?? "").toLowerCase().includes(search.toLowerCase())) &&
    (!priority || t.priority === priority);
  const all = tickets.filter(match);
  const open = all.filter((t) => t.status !== "resolved" && t.status !== "closed");
  const rows = tab === "open" ? open : all;

  return (
    <>
      <PageHeader title="Support tickets" description="Resident complaints and requests." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open" value={String(tickets.filter((t) => t.status === "open").length)} trend="flat" hint="unassigned" />
        <StatCard label="In progress" value={String(tickets.filter((t) => t.status === "in_progress").length)} hint="being handled" />
        <StatCard label="Resolved" value={String(tickets.filter((t) => t.status === "resolved").length)} trend="up" hint="closed out" />
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Tickets</CardTitle>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <SingleSelect
              value={priority}
              onChange={setPriority}
              placeholder="All priorities"
              options={[
                { value: "", label: "All priorities" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
            />
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search subject or resident…" className="h-9 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTabs
            className="mb-4"
            value={tab}
            onValueChange={setTab}
            options={[
              { value: "open", label: "Open & active", count: open.length },
              { value: "all", label: "All", count: all.length },
            ]}
          />
          <TicketTable
            rows={rows}
            loading={loading}
            busyId={busyId}
            onStatus={setStatus}
            onAssign={setAssigning}
            onView={setSelected}
          />
        </CardContent>
      </Card>

      <TicketDetailDialog ticket={selected} onClose={() => setSelected(null)} canManage busy={!!busyId} onStatus={setStatus} />

      <Dialog open={!!assigning} onOpenChange={(open) => !open && setAssigning(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign ticket to yourself</DialogTitle>
            <DialogDescription>
              You will become the handler for &ldquo;{assigning?.subject}&rdquo;. The ticket moves to
              <span className="font-medium"> In progress</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigning(null)} disabled={busyId === assigning?.id}>
              Cancel
            </Button>
            <Button onClick={confirmAssign} disabled={busyId === assigning?.id}>
              {busyId === assigning?.id ? "Assigning…" : "Assign to me"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TicketTable({
  rows,
  loading,
  busyId,
  onStatus,
  onAssign,
  onView,
}: {
  rows: Ticket[];
  loading: boolean;
  busyId: string | null;
  onStatus: (id: string, status: string) => void;
  onAssign: (t: Ticket) => void;
  onView: (t: Ticket) => void;
}) {
  if (loading) return <SkeletonTable cols={5} />;
  if (rows.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">No tickets here.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject</TableHead>
          <TableHead>By</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((t) => (
          <TableRow key={t.id} className="cursor-pointer" onClick={() => onView(t)}>
            <TableCell className="font-medium">{t.subject}</TableCell>
            <TableCell className="text-muted-foreground">{t.student?.user?.full_name ?? "—"}</TableCell>
            <TableCell><Badge variant="outline" className={`capitalize ${priorityColor[t.priority]}`}>{t.priority}</Badge></TableCell>
            <TableCell><StatusBadge status={t.status} /></TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              {t.status !== "resolved" && t.status !== "closed" ? (
                <div className="flex items-center justify-end gap-2">
                  {t.status === "open" && (
                    <Button size="sm" variant="ghost" disabled={busyId === t.id} onClick={() => onAssign(t)}>
                      Assign
                    </Button>
                  )}
                  <Button size="sm" variant="outline" disabled={busyId === t.id}
                    onClick={() => onStatus(t.id, t.status === "open" ? "in_progress" : "resolved")}>
                    {t.status === "open" ? "Start" : "Resolve"}
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => onView(t)}>View</Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
