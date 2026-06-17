"use client";

import * as React from "react";
import { Check, ClipboardCheck, Download, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAsync } from "@/lib/useAsync";
import { Badge } from "@/components/ui/badge";
import { attendanceApi, useAttendanceReport, useLeaveReview } from "@/lib/features/attendance";
import { studentsApi } from "@/lib/features/students";

const STATUSES = ["present", "absent", "leave", "medical"] as const;

export default function WardenAttendance() {
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const daily = useAsync(() => attendanceApi.dailyAttendance(today), [today]);
  const { requests, loading, review, busyId } = useLeaveReview();
  const report = useAttendanceReport();
  const pending = requests.filter((r) => r.status === "pending");

  return (
    <>
      <PageHeader title="Attendance & leave" description={`Today · ${today}`}>
        <Button variant="outline" disabled={report.exporting} onClick={report.exportAttendance}>
          {report.exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export
        </Button>
        <MarkAttendanceDialog today={today} onDone={daily.refetch} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Marked today" value={String(daily.data?.length ?? 0)} trend="flat" hint="attendance records" />
        <StatCard label="Pending leave" value={String(pending.length)} trend="flat" hint="needs review" />
        <StatCard label="Leave requests" value={String(requests.length)} hint="this cycle" />
      </div>

      {report.report && (
        <Card>
          <CardHeader>
            <CardTitle>Leave report</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Attendance records: </span>
              <span className="font-semibold">{report.report.attendance_total}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Leave requests: </span>
              <span className="font-semibold">{report.report.leave_requests_total}</span>
            </div>
            {Object.entries(report.report.leave_by_status).map(([status, count]) => (
              <Badge key={status} variant="secondary" className="font-normal capitalize">
                {status}: {count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="leave">
            <TabsList className="mb-4">
              <TabsTrigger value="leave">Leave requests</TabsTrigger>
              <TabsTrigger value="attendance">Daily attendance</TabsTrigger>
            </TabsList>

            <TabsContent value="leave">
              {loading ? (
                <Loading />
              ) : requests.length === 0 ? (
                <Empty label="No leave requests." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resident</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.student?.user?.full_name ?? "Resident"}</TableCell>
                        <TableCell className="text-muted-foreground">{l.leaveType?.name ?? "Leave"}</TableCell>
                        <TableCell className="text-muted-foreground">{String(l.start_date).slice(0, 10)} – {String(l.end_date).slice(0, 10)}</TableCell>
                        <TableCell><StatusBadge status={l.status} /></TableCell>
                        <TableCell className="text-right">
                          {l.status === "pending" && (
                            <div className="flex justify-end gap-1.5">
                              <Button size="icon-sm" variant="outline" className="text-success" disabled={busyId === l.id} onClick={() => review(l.id, "approved")}>
                                {busyId === l.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                              </Button>
                              <Button size="icon-sm" variant="outline" className="text-destructive" disabled={busyId === l.id} onClick={() => review(l.id, "rejected")}>
                                <X className="size-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="attendance">
              {daily.loading ? (
                <Loading />
              ) : (daily.data?.length ?? 0) === 0 ? (
                <Empty label="No attendance marked for today yet." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resident</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(daily.data ?? []).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.student?.user?.full_name ?? "Resident"}</TableCell>
                        <TableCell className="text-muted-foreground">{String(a.attendance_date).slice(0, 10)}</TableCell>
                        <TableCell className="text-right"><StatusBadge status={a.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}

function MarkAttendanceDialog({ today, onDone }: { today: string; onDone: () => void }) {
  const [open, setOpen] = React.useState(false);
  const students = useAsync(() => studentsApi.list(), [], { enabled: open });
  const [statuses, setStatuses] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  const list = students.data ?? [];
  const getStatus = (id: string) => statuses[id] ?? "present";

  const submit = async () => {
    if (list.length === 0) return;
    setBusy(true);
    try {
      const records = list.map((s) => ({ student_id: s.id, attendance_date: today, status: getStatus(s.id) }));
      await attendanceApi.markAttendance(records);
      toast.success("Attendance marked");
      onDone();
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <ClipboardCheck className="size-4" /> Mark attendance
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mark attendance · {today}</DialogTitle>
          <DialogDescription>Set each resident&apos;s status, then save.</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {students.loading ? (
            <Loading />
          ) : list.length === 0 ? (
            <Empty label="No residents to mark yet." />
          ) : (
            list.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                <span className="truncate text-sm font-medium">{s.user?.full_name ?? s.student_id ?? "Resident"}</span>
                <div className="flex shrink-0 gap-1">
                  {STATUSES.map((st) => (
                    <Button key={st} size="sm" variant={getStatus(s.id) === st ? "secondary" : "ghost"}
                      className="h-7 px-2 text-xs capitalize"
                      onClick={() => setStatuses((m) => ({ ...m, [s.id]: st }))}>
                      {st}
                    </Button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={busy || list.length === 0} onClick={submit}>
            {busy && <Loader2 className="size-4 animate-spin" />} Save attendance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Loading…
    </div>
  );
}
function Empty({ label }: { label: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{label}</p>;
}
