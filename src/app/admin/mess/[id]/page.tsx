"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DetailBackLink, InfoCard, InfoGrid, DetailSkeleton, type InfoItem } from "@/components/dashboard/detail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAsync } from "@/lib/useAsync";
import { messApi, type MessBill } from "@/lib/features/mess";
import { studentsApi } from "@/lib/features/students";

const date = (v?: string | null) => (v ? String(v).slice(0, 10) : "—");
const month = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—";
const money = (v?: string | number | null) => (v == null ? "—" : `₨ ${Number(v).toLocaleString()}`);

export default function MessSubscriptionDetail() {
  const { id } = useParams<{ id: string }>();

  // Only the list endpoint exists, so fetch all subscriptions and find this one.
  const subsQ = useAsync(() => messApi.adminSubscriptions(), [], { key: "mess:subscriptions" });
  const subscription = (subsQ.data ?? []).find((s) => s.id === id) ?? null;

  const studentId = subscription?.student?.id ?? subscription?.student_id;
  const studentQ = useAsync(() => studentsApi.getById(studentId!), [studentId], {
    key: `students:${studentId}`,
    enabled: !!studentId,
  });

  // The admin billing report carries per-resident bills; filter to this resident.
  const billingQ = useAsync(() => messApi.billingReport(), [], { key: "mess:billing" });

  if (subsQ.loading && !subscription) return <DetailSkeleton sections={4} />;
  if (!subscription) {
    return (
      <>
        <DetailBackLink href="/admin/mess" label="Back to mess" />
        <p className="py-20 text-center text-sm text-muted-foreground">Subscription not found.</p>
      </>
    );
  }

  const student = studentQ.data;
  const allBills = billingQ.data?.bills ?? [];
  const bills: MessBill[] = allBills.filter(
    (b) =>
      b.subscription?.id === subscription.id ||
      b.subscription?.student_id === subscription.student_id ||
      b.student?.id === studentId,
  );

  const name = student?.user?.full_name ?? subscription.student?.user?.full_name ?? "Resident";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");

  const subscriptionInfo: InfoItem[] = [
    { label: "Status", value: <StatusBadge status={subscription.status} /> },
    { label: "Plan", value: subscription.messPlan?.name ?? "—" },
    { label: "Plan type", value: subscription.messPlan?.plan_type?.replace(/_/g, " ") ?? "—" },
    { label: "Price / month", value: money(subscription.messPlan?.price_per_month) },
    { label: "Start date", value: date(subscription.start_date) },
    { label: "End date", value: date(subscription.end_date) },
  ];

  const studentInfo: InfoItem[] = [
    { label: "Student ID", value: student?.student_id ?? subscription.student?.student_id ?? "—" },
    { label: "Department", value: student?.department ?? "—" },
    { label: "Year", value: student?.year_of_study ? `Year ${student.year_of_study}` : "—" },
    { label: "Gender", value: student?.gender ?? "—" },
    { label: "Date of birth", value: date(student?.date_of_birth) },
    { label: "Blood group", value: student?.blood_group ?? "—" },
    { label: "Guardian", value: student?.guardian_name ?? "—" },
    { label: "Guardian phone", value: student?.guardian_phone ?? "—" },
    { label: "Address", value: student?.address ?? "—" },
  ];

  return (
    <>
      <DetailBackLink href="/admin/mess" label="Back to mess" />
      <PageHeader title={name} description="Mess subscription — resident, plan and bills." />

      <div className="mx-auto w-full max-w-5xl space-y-4">
        {/* Resident header */}
        <InfoCard title="Resident">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <Avatar className="size-20 shrink-0">
              {student?.profile_image_url && <AvatarImage src={student.profile_image_url} alt={name} />}
              <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground">
                {student?.student_id ?? subscription.student?.student_id ?? "Resident"}
              </p>
            </div>
            <div className="space-y-2 text-sm sm:ml-auto sm:text-left">
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start">
                <Mail className="size-4 shrink-0" /> {student?.user?.email ?? subscription.student?.user?.email ?? "—"}
              </p>
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start">
                <Phone className="size-4 shrink-0" /> {student?.user?.phone ?? "—"}
              </p>
            </div>
          </div>
        </InfoCard>

        <InfoCard title="Subscription">
          <InfoGrid items={subscriptionInfo} />
        </InfoCard>

        <InfoCard title="Resident profile" description="Information on file with administration">
          {studentQ.loading && !student ? <InfoGridSkeleton /> : <InfoGrid items={studentInfo} />}
        </InfoCard>

        <InfoCard title="Mess bills" description="All mess bills raised for this resident">
          {billingQ.loading && bills.length === 0 ? (
            <InfoGridSkeleton />
          ) : bills.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No bills yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{month(b.month)}</TableCell>
                    <TableCell>{money(b.amount_due)}</TableCell>
                    <TableCell>{money(b.amount_paid)}</TableCell>
                    <TableCell className="text-muted-foreground">{date(b.due_date)}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={b.status} /></TableCell>
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
