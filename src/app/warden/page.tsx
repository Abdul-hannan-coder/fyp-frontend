"use client";

import * as React from "react";
import { Check, Loader2, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOverview } from "@/lib/features/reports";
import { useAllocationRequests } from "@/lib/features/allocation/useAllocation";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { useVisitors } from "@/lib/features/visitors";
import { useSupport } from "@/lib/features/support";

const nameOf = (s?: { student_id?: string; user?: { full_name: string } }) =>
  s?.user?.full_name ?? s?.student_id ?? "Resident";

export default function WardenDashboard() {
  const { overview } = useOverview();
  const { requests, loading, review, busyId } = useAllocationRequests("pending");
  const [pending, setPending] = React.useState<{ id: string } | null>(null);
  const { visitors } = useVisitors("today");
  const { tickets } = useSupport("all");

  const occ = overview?.occupancy;
  const att = overview?.attendance;
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress");

  return (
    <>
      <PageHeader
        title="Operations dashboard"
        description="Everything that needs your attention today."
      >
        <ButtonLink href="/warden/attendance">Mark attendance</ButtonLink>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending Requests" value={String(requests.length)} trend="flat" hint="allocation" />
        <StatCard label="Attendance" value={`${Math.round(att?.attendance_rate ?? 0)}%`} trend="up" hint="present rate" />
        <StatCard label="Visitors Inside" value={String(overview?.visitor?.currently_inside ?? 0)} trend="flat" hint="checked in" />
        <StatCard label="Open Tickets" value={String(openTickets.length)} trend="flat" hint="support" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pending allocation requests */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Pending allocation requests</CardTitle>
              <CardDescription>{requests.length} awaiting your review</CardDescription>
            </div>
            <ButtonLink href="/warden/allocation" variant="ghost" size="sm">
              View all
            </ButtonLink>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading />
            ) : requests.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No pending requests.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Room type</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.slice(0, 6).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-medium">{nameOf(r.student)}</p>
                        <p className="text-xs text-muted-foreground">{r.academic_year} · {r.semester}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.preferredRoomType?.name ?? "Any"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="icon-sm" variant="outline" className="text-success" disabled={busyId === r.id}
                            onClick={() => review(r.id, "approved")}>
                            <Check className="size-4" />
                          </Button>
                          <Button size="icon-sm" variant="outline" className="text-destructive" disabled={busyId === r.id}
                            onClick={() => setPending({ id: r.id })}>
                            <X className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Occupancy snapshot */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy</CardTitle>
            <CardDescription>{occ?.occupied_rooms ?? 0} of {occ?.total_rooms ?? 0} rooms</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-6">
            <p className="font-heading text-5xl font-semibold">{Math.round(occ?.occupancy_rate ?? 0)}%</p>
            <p className="text-sm text-muted-foreground">currently occupied</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Visitors */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Visitors today</CardTitle>
              <CardDescription>Live check-in log</CardDescription>
            </div>
            <ButtonLink href="/warden/visitors" variant="ghost" size="sm">
              View all
            </ButtonLink>
          </CardHeader>
          <CardContent>
            {visitors.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No visitors today.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitors.slice(0, 6).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-muted-foreground">{nameOf(v.student)}</TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={v.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Open tickets */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Support tickets</CardTitle>
              <CardDescription>Open & in-progress</CardDescription>
            </div>
            <ButtonLink href="/warden/support" variant="ghost" size="sm">
              View all
            </ButtonLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {openTickets.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No open tickets.</p>
            ) : (
              openTickets.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div className="leading-tight">
                    <p className="text-sm font-medium">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {nameOf(t.student)} · {t.category}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title="Reject request"
        description="Reject this allocation request?"
        confirmLabel="Reject"
        destructive
        withReason
        busy={!!pending && busyId === pending.id}
        onConfirm={(reason) => { if (pending) { review(pending.id, "rejected", reason || "Rejected"); setPending(null); } }}
      />
    </>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Loading…
    </div>
  );
}
