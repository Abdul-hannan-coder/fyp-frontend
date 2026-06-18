"use client";

import {
  BedDouble,
  CalendarPlus,
  CreditCard,
  LifeBuoy,
  MapPin,
  UserPlus,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Card as UICard } from "@/components/ui/card";
import { Stepper } from "@/components/journey/stepper";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/features/auth/useAuth";
import { useMyAllocation } from "@/lib/features/allocation/useAllocation";
import { useMyPayments } from "@/lib/features/fees/useFees";
import { useMyLeave } from "@/lib/features/attendance";
import { useMyMess } from "@/lib/features/mess";
import { useAnnouncements } from "@/lib/features/announcements";

const money = (v: number) => `₨ ${Number(v).toLocaleString()}`;

const quickActions = [
  { label: "Pay fees", href: "/student/fees", icon: CreditCard },
  { label: "Apply for leave", href: "/student/attendance", icon: CalendarPlus },
  { label: "Register visitor", href: "/student/visitors", icon: UserPlus },
  { label: "Raise a ticket", href: "/student/support", icon: LifeBuoy },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { allocation, loading: allocLoading } = useMyAllocation();
  const { payments } = useMyPayments();
  const { summary } = useMyLeave();
  const { plan } = useMyMess();
  const { announcements } = useAnnouncements("active");

  const duePayments = payments.filter((p) => p.status === "pending" || p.status === "partial" || p.status === "overdue");
  const totalDue = duePayments.reduce((s, p) => s + (Number(p.total_amount) - Number(p.amount_paid)), 0);
  const nextDue = duePayments[0];

  const isConfirmed = allocation?.status === "active";
  const currentStep = !allocation ? 0 : allocation.status === "active" ? 2 : 1;

  return (
    <>
      <PageHeader
        title={`Welcome home${user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}`}
        description="Here's everything about your stay at a glance."
      >
        <ButtonLink href="/student/fees">
          <Wallet className="size-4" /> Pay fees
        </ButtonLink>
      </PageHeader>

      {/* Onboarding / booking status banner — only until confirmed */}
      {!isConfirmed && (
        <UICard className="border-gold/30 bg-gold/5">
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Wallet className="size-5" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold tracking-tight">
                  {allocation ? "Complete your payment" : "Reserve your room"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {allocation
                    ? "Your room is reserved — complete payment to confirm your spot."
                    : "Apply for a room to get started with your stay."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden flex-1 xl:block">
                <Stepper
                  steps={[{ label: "Reserve" }, { label: "Pay" }, { label: "Confirmed" }]}
                  current={currentStep}
                  className="w-72"
                />
              </div>
              <ButtonLink href="/student/booking" className="shrink-0">
                {allocation ? "Complete payment" : "Start booking"}
              </ButtonLink>
            </div>
          </div>
        </UICard>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Room" value={allocation?.room?.room_number ?? "—"} hint={allocation?.room?.roomType?.name ?? "Not allocated"} trend="flat" />
        <StatCard label="Fees Due" value={money(totalDue)} hint={nextDue ? "Action needed" : "All clear"} trend="flat" />
        <StatCard label="Attendance" value={`${Math.round(summary?.present_percentage ?? 0)}%`} trend="up" hint="this year" />
        <StatCard label="Mess Plan" value={plan?.messPlan?.name ?? "None"} hint={plan ? "Active" : "Not subscribed"} trend="flat" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Room card */}
        <Card>
          <CardHeader>
            <CardTitle>Your room</CardTitle>
            <CardDescription>{allocation?.room?.roomType?.name ?? "Accommodation"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {allocLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[72px] w-full rounded-xl" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ) : !allocation ? (
              <div className="space-y-3">
                <p className="py-4 text-center text-sm text-muted-foreground">No room allocated yet.</p>
                <ButtonLink href="/student/booking" className="w-full">Book a room</ButtonLink>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <BedDouble className="size-5" />
                  </div>
                  <div>
                    <p className="font-heading text-lg font-semibold">Room {allocation.room?.room_number ?? "—"}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {allocation.academic_year} · {allocation.semester}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <Row label="Type" value={allocation.room?.roomType?.name ?? "—"} />
                  <Row label="Bed" value={allocation.bed_number ? `Bed ${allocation.bed_number}` : "—"} />
                  <Row label="Status" value={<StatusBadge status={allocation.status} />} />
                </div>
                <ButtonLink href="/student/room" variant="outline" className="w-full">
                  View room details
                </ButtonLink>
              </>
            )}
          </CardContent>
        </Card>

        {/* Fees */}
        <Card>
          <CardHeader>
            <CardTitle>Fees & payments</CardTitle>
            <CardDescription>Your dues this term</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextDue && (
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
                <p className="text-xs font-medium text-warning">Next payment due</p>
                <p className="mt-1 font-heading text-2xl font-semibold">
                  {money(Number(nextDue.total_amount) - Number(nextDue.amount_paid))}
                </p>
                <p className="text-xs text-muted-foreground">{nextDue.feeStructure?.name ?? "Hostel fee"}</p>
              </div>
            )}
            {payments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No payments on record.</p>
            ) : (
              <div className="space-y-2">
                {payments.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p.feeStructure?.name ?? "Hostel fee"}</span>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
            <ButtonLink href="/student/fees" className="w-full">Pay now</ButtonLink>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Your record this year</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex flex-col items-center gap-1 py-2">
              <p className="font-heading text-4xl font-semibold text-success">{Math.round(summary?.present_percentage ?? 0)}%</p>
              <p className="text-sm text-muted-foreground">present</p>
            </div>
            <Progress value={summary?.present_percentage ?? 0} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div><p className="font-semibold">{summary?.present ?? 0}</p><p className="text-muted-foreground">Present</p></div>
              <div><p className="font-semibold">{summary?.leave ?? 0}</p><p className="text-muted-foreground">Leave</p></div>
              <div><p className="font-semibold">{summary?.absent ?? 0}</p><p className="text-muted-foreground">Absent</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Common things you do</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <ButtonLink key={a.label} href={a.href} variant="outline" className="h-auto flex-col gap-2 py-4">
                <a.icon className="size-5 text-primary" />
                <span className="text-xs font-medium">{a.label}</span>
              </ButtonLink>
            ))}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Latest notices</CardTitle>
              <CardDescription>From your hostel administration</CardDescription>
            </div>
            <ButtonLink href="/student/announcements" variant="ghost" size="sm">
              View all
            </ButtonLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No notices right now.</p>
            ) : (
              announcements.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BedDouble className="size-4" />
                  </div>
                  <div className="flex-1 leading-snug">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{a.content}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {(a.published_at || a.createdAt || "").slice(0, 10)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
