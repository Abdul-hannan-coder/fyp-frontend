"use client";

import * as React from "react";
import { CalendarPlus, X } from "lucide-react";
import { SkeletonTable } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMyLeave } from "@/lib/features/attendance";
import SimpleSelect from "@/components/ui/simple-select";

export default function StudentAttendance() {
  const { requests, summary, balances, loading, error, busy, apply, cancel } = useMyLeave();
  const [open, setOpen] = React.useState(false);

  const breakdown = [
    { label: "Present", value: summary?.present ?? 0, tone: "var(--chart-1)" },
    { label: "Absent", value: summary?.absent ?? 0, tone: "var(--chart-3)" },
    { label: "Leave", value: summary?.leave ?? 0, tone: "var(--chart-2)" },
    { label: "Medical", value: summary?.medical ?? 0, tone: "var(--chart-4)" },
  ];
  const total = summary?.total || breakdown.reduce((s, b) => s + b.value, 0);

  return (
    <>
      <PageHeader title="Attendance & leave" description="Your attendance record and leave requests.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <CalendarPlus className="size-4" /> Apply for leave
          </DialogTrigger>
          <ApplyLeaveDialog
            balances={balances}
            busy={busy}
            onSubmit={async (input) => {
              const ok = await apply(input);
              if (ok) setOpen(false);
            }}
          />
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="This year" value={`${Math.round(summary?.present_percentage ?? 0)}%`} trend="up" hint="present" />
        <StatCard label="Leaves taken" value={String(requests.filter((r) => r.status === "approved").length)} hint="approved" />
        <StatCard label="Pending" value={String(requests.filter((r) => r.status === "pending").length)} trend="flat" hint="awaiting review" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance breakdown</CardTitle>
            <CardDescription>{total} marks recorded this year</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {breakdown.map((b) => (
              <div key={b.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-medium">{b.value}</span>
                </div>
                <Progress value={total ? (b.value / total) * 100 : 0} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leave balance</CardTitle>
            <CardDescription>Remaining days this year</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {balances.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">No leave types configured.</p>
            ) : (
              balances.map((b) => (
                <div key={b.leave_type_id} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{b.leave_type}</span>
                  <span className="font-medium">
                    {(b.remaining_days ?? b.allowed_days - b.used_days)} / {b.allowed_days}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave requests</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="py-6 text-center text-sm text-destructive">{error}</p>}
          {loading ? (
            <SkeletonTable cols={5} />
          ) : requests.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No leave requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.leaveType?.name ?? "Leave"}</TableCell>
                    <TableCell className="text-muted-foreground">{String(l.start_date).slice(0, 10)}</TableCell>
                    <TableCell className="text-muted-foreground">{String(l.end_date).slice(0, 10)}</TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                    <TableCell className="text-right">
                      {l.status === "pending" ? (
                        <Button size="icon-sm" variant="ghost" className="text-destructive" disabled={busy}
                          onClick={() => cancel(l.id)}>
                          <X className="size-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
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

function ApplyLeaveDialog({
  balances,
  busy,
  onSubmit,
}: {
  balances: { leave_type_id: string; leave_type: string }[];
  busy: boolean;
  onSubmit: (input: { leave_type_id: string; start_date: string; end_date: string; reason: string }) => void;
}) {
  const [leaveTypeId, setLeaveTypeId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [reason, setReason] = React.useState("");

  const valid = leaveTypeId && startDate && endDate && reason.trim().length >= 5;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Apply for leave</DialogTitle>
        <DialogDescription>Submit a leave request for warden approval.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Leave type</Label>
          <SimpleSelect
            value={leaveTypeId}
            onChange={setLeaveTypeId}
            className="w-full"
            placeholder="Select a type…"
            options={balances.map((b) => ({ value: b.leave_type_id, label: b.leave_type }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="start-date">From</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end-date">To</Label>
            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason</Label>
          <Textarea id="reason" placeholder="Briefly explain your leave…" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
      <DialogFooter showCloseButton>
        <Button
          disabled={!valid || busy}
          onClick={() => onSubmit({ leave_type_id: leaveTypeId, start_date: startDate, end_date: endDate, reason })}
        >
          Submit request
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
