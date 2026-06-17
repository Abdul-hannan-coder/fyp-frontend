"use client";

import * as React from "react";
import {
  ArrowRight,
  BedDouble,
  Boxes,
  Building2,
  Check,
  ClipboardList,
  Megaphone,
  RefreshCw,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FeeDonut } from "@/components/dashboard/charts";
import { useAuth } from "@/lib/features/auth/useAuth";
import { useOverview, useFeeDashboard } from "@/lib/features/reports";
import { useUsers } from "@/lib/features/users/useUsers";
import { usePayments } from "@/lib/features/fees/useFees";
import { useAllocationRequests } from "@/lib/features/allocation/useAllocation";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const money = (v?: number) => `₨ ${Number(v ?? 0).toLocaleString()}`;
const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");

const QUICK_NAV = [
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Hostel Setup", href: "/admin/setup", icon: Building2 },
  { label: "Allocations", href: "/admin/allocations", icon: BedDouble },
  { label: "Finance", href: "/admin/finance", icon: Wallet },
  { label: "Staff", href: "/admin/staff", icon: UserCog },
  { label: "Assets", href: "/admin/assets", icon: Boxes },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "Reports", href: "/admin/reports", icon: ClipboardList },
];

type PendingReject = { label: string; run: (reason: string) => void };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [pending, setPending] = React.useState<PendingReject | null>(null);
  const { overview, loading, refetch } = useOverview();
  const { fees, refetch: refetchFees } = useFeeDashboard();
  const { users, approve, reject, busyId: userBusy, refetch: refetchUsers } = useUsers();
  const { payments, verify, busyId: payBusy, refetch: refetchPayments } = usePayments();
  const { requests, review, busyId: reqBusy, refetch: refetchReqs } = useAllocationRequests("pending");

  const occ = overview?.occupancy;
  const rev = overview?.revenue;

  const pendingApps = users.filter((u) => !u.is_approved && u.is_verified && u.role?.name === "student");
  const toVerify = payments.filter((p) => p.status === "pending" || p.status === "partial");
  const actionCount = pendingApps.length + toVerify.length + requests.length;

  const donut = [
    { name: "Collected", value: Math.round(fees?.total_collected ?? 0), fill: "var(--chart-1)" },
    { name: "Pending", value: Math.round(fees?.total_pending ?? 0), fill: "var(--chart-2)" },
    { name: "Overdue", value: Math.round(fees?.total_overdue ?? 0), fill: "var(--chart-3)" },
  ].filter((d) => d.value > 0);

  const refreshAll = () => {
    refetch();
    refetchFees();
    refetchUsers();
    refetchPayments();
    refetchReqs();
  };

  const empty = (occ?.total_rooms ?? 0) === 0 && users.length <= 1;

  return (
    <>
      <PageHeader
        title={`Welcome back${user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}`}
        description="Your hostel at a glance — and everything that needs you today."
      >
        <Button variant="outline" onClick={refreshAll}>
          <RefreshCw className="size-4" /> Refresh
        </Button>
      </PageHeader>

      {empty && (
        <Card className="border-gold/30 bg-gold/5">
          <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-heading text-lg font-semibold">Let&apos;s set up your hostel</p>
              <p className="text-sm text-muted-foreground">
                Start by creating blocks, floors, room types and rooms — then residents can apply.
              </p>
            </div>
            <ButtonLink href="/admin/setup" className="shrink-0">
              Go to Hostel Setup <ArrowRight className="size-4" />
            </ButtonLink>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Occupancy" value={`${Math.round(occ?.occupancy_rate ?? 0)}%`} hint={`${occ?.occupied_rooms ?? 0} / ${occ?.total_rooms ?? 0} rooms`} />
        <StatCard label="Collected" value={money(rev?.collected ?? fees?.total_collected)} hint={`${Math.round(rev?.collection_rate ?? fees?.collection_rate ?? 0)}% of due`} />
        <StatCard label="Needs action" value={String(actionCount)} trend={actionCount > 0 ? "flat" : "up"} hint="approvals · payments · requests" />
        <StatCard label="Total users" value={String(users.length)} hint={`${pendingApps.length} awaiting approval`} />
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {/* Needs your attention */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Applications */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Pending applications</CardTitle>
              <CardDescription>{pendingApps.length} awaiting review</CardDescription>
            </div>
            <ButtonLink href="/admin/users" variant="ghost" size="sm">All</ButtonLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApps.length === 0 ? (
              <Empty>No applications to review.</Empty>
            ) : (
              pendingApps.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-8"><AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials(a.full_name)}</AvatarFallback></Avatar>
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-sm font-medium">{a.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon-sm" variant="outline" className="text-success" disabled={userBusy === a.id} onClick={() => approve(a.id)}>
                      <Check className="size-4" />
                    </Button>
                    <Button size="icon-sm" variant="outline" className="text-destructive" disabled={userBusy === a.id}
                      onClick={() => setPending({ label: `Reject ${a.full_name}'s application`, run: (reason) => reject(a.id, reason || "Not eligible") })}>
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Payments to verify */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Payments to verify</CardTitle>
              <CardDescription>{toVerify.length} awaiting verification</CardDescription>
            </div>
            <ButtonLink href="/admin/finance" variant="ghost" size="sm">All</ButtonLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {toVerify.length === 0 ? (
              <Empty>Nothing to verify.</Empty>
            ) : (
              toVerify.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-sm font-medium">{p.student?.user?.full_name ?? p.student?.student_id ?? "Resident"}</p>
                    <p className="truncate text-xs text-muted-foreground">{money(Number(p.total_amount))} · {p.feeStructure?.name ?? "Fee"}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon-sm" variant="outline" className="text-success" disabled={payBusy === p.id} onClick={() => verify(p.id, "paid")}>
                      <Check className="size-4" />
                    </Button>
                    <Button size="icon-sm" variant="outline" className="text-destructive" disabled={payBusy === p.id}
                      onClick={() => setPending({ label: "Reject this payment", run: (reason) => verify(p.id, "rejected", reason || "Rejected") })}>
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Allocation requests */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Allocation requests</CardTitle>
              <CardDescription>{requests.length} pending</CardDescription>
            </div>
            <ButtonLink href="/admin/allocations" variant="ghost" size="sm">All</ButtonLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.length === 0 ? (
              <Empty>No pending requests.</Empty>
            ) : (
              requests.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-sm font-medium">{r.student?.user?.full_name ?? r.student?.student_id ?? "Student"}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.preferredRoomType?.name ?? "Any room"} · {r.academic_year}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon-sm" variant="outline" className="text-success" disabled={reqBusy === r.id} onClick={() => review(r.id, "approved")}>
                      <Check className="size-4" />
                    </Button>
                    <Button size="icon-sm" variant="outline" className="text-destructive" disabled={reqBusy === r.id}
                      onClick={() => setPending({ label: "Reject this request", run: (reason) => review(r.id, "rejected", reason || "Rejected") })}>
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visual: occupancy + fee mix */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Occupancy</CardTitle>
            <CardDescription>{occ?.occupied_rooms ?? 0} of {occ?.total_rooms ?? 0} rooms occupied</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <Progress value={occ?.occupancy_rate ?? 0} className="h-3" />
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div><p className="font-heading text-2xl font-semibold">{occ?.total_rooms ?? 0}</p><p className="text-xs text-muted-foreground">Total rooms</p></div>
              <div><p className="font-heading text-2xl font-semibold text-success">{occ?.occupied_rooms ?? 0}</p><p className="text-xs text-muted-foreground">Occupied</p></div>
              <div><p className="font-heading text-2xl font-semibold">{(occ?.total_rooms ?? 0) - (occ?.occupied_rooms ?? 0)}</p><p className="text-xs text-muted-foreground">Available</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee collection</CardTitle>
            <CardDescription>Collected vs outstanding</CardDescription>
          </CardHeader>
          <CardContent>
            {donut.length === 0 ? (
              <Empty>No fee data yet.</Empty>
            ) : (
              <>
                <FeeDonut data={donut} />
                <div className="mt-4 space-y-2">
                  {donut.map((d) => (
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
      </div>

      {/* Quick navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Quick navigation</CardTitle>
          <CardDescription>Jump to any admin area</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_NAV.map((n) => (
            <ButtonLink key={n.href} href={n.href} variant="outline" className="h-auto flex-col gap-2 py-4">
              <n.icon className="size-5 text-primary" />
              <span className="text-xs font-medium">{n.label}</span>
            </ButtonLink>
          ))}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title={pending?.label ?? "Reject"}
        confirmLabel="Reject"
        destructive
        withReason
        onConfirm={(reason) => { pending?.run(reason); setPending(null); }}
      />
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
