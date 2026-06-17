"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DetailBackLink, InfoCard, InfoGrid, DetailSkeleton, type InfoItem } from "@/components/dashboard/detail";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAsync } from "@/lib/useAsync";
import {
  staffApi,
  type StaffDuty,
  type StaffSchedule,
} from "@/lib/features/staff";

const date = (v?: string | null) => (v ? String(v).slice(0, 10) : "—");
const time = (v?: string | null) => (v ? String(v).slice(0, 5) : "—");
const titleCase = (v?: string | null) => (v ? String(v).replace(/_/g, " ") : "—");
const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");

// Match a duty/schedule to this staff member by either the flat foreign key or
// the nested staff record id (the API returns whichever it has).
const belongsTo = (id: string, row: { staff_id?: string; staff?: { id: string } }) =>
  row.staff_id === id || row.staff?.id === id;

export default function StaffDetail() {
  const { id } = useParams<{ id: string }>();

  const memberQ = useAsync(() => staffApi.getById(id), [id], { key: `staff:${id}` });
  const dutiesQ = useAsync(() => staffApi.duties(), [], { key: "staff:duties" });
  const schedulesQ = useAsync(() => staffApi.schedules(), [], { key: "staff:schedules" });

  const member = memberQ.data;

  if (memberQ.loading && !member) return <DetailSkeleton sections={3} />;
  if (!member) {
    return (
      <>
        <DetailBackLink href="/admin/staff" label="Back to staff" />
        <p className="py-20 text-center text-sm text-muted-foreground">Staff member not found.</p>
      </>
    );
  }

  const name = member.user?.full_name ?? member.name ?? "Staff member";
  const email = member.user?.email ?? "—";
  const phone = member.phone ?? member.user?.phone ?? "—";
  const roleName = member.role?.name ?? member.staffRole?.name ?? "—";

  const duties = (dutiesQ.data ?? []).filter((d) => belongsTo(member.id, d));
  const schedules = (schedulesQ.data ?? []).filter((s) => belongsTo(member.id, s));

  const profileInfo: InfoItem[] = [
    { label: "Role", value: roleName },
    { label: "Employment status", value: <StatusBadge status={member.employment_status ?? "active"} /> },
    { label: "Salary grade", value: member.salary_grade ?? "—" },
    { label: "Assigned block", value: member.assignedBlock?.name ?? "—" },
    { label: "Joining date", value: date(member.joining_date ?? member.createdAt) },
    { label: "Phone", value: phone },
  ];

  return (
    <>
      <DetailBackLink href="/admin/staff" label="Back to staff" />
      <PageHeader title={name} description="Staff member — profile, duties and schedule." />

      <div className="mx-auto w-full max-w-5xl space-y-4">
        {/* Header */}
        <InfoCard title="Staff member">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <Avatar className="size-20 shrink-0">
              <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">{initials(name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground capitalize">{roleName}</p>
            </div>
            <div className="space-y-2 text-sm sm:ml-auto sm:text-left">
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><Mail className="size-4 shrink-0" /> {email}</p>
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><Phone className="size-4 shrink-0" /> {phone}</p>
            </div>
          </div>
        </InfoCard>

        <InfoCard title="Employment">
          <InfoGrid items={profileInfo} />
        </InfoCard>

        <InfoCard title="Duties" description="Duties assigned to this staff member">
          {dutiesQ.loading && duties.length === 0 ? (
            <InfoGridSkeleton />
          ) : duties.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No duties assigned.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duties.map((d: StaffDuty) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium capitalize">{titleCase(d.duty_type)}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{d.priority ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{d.description ?? "—"}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={d.status ?? "pending"} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </InfoCard>

        <InfoCard title="Schedule" description="Weekly shifts for this staff member">
          {schedulesQ.loading && schedules.length === 0 ? (
            <InfoGridSkeleton />
          ) : schedules.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No schedule set.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead className="text-right">Effective from</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s: StaffSchedule) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.is_off_day ? `${s.day_of_week ?? "—"} (off)` : s.day_of_week ?? "—"}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{titleCase(s.shift_type)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.shift_start && s.shift_end ? `${time(s.shift_start)} – ${time(s.shift_end)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{date(s.effective_from)}</TableCell>
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
