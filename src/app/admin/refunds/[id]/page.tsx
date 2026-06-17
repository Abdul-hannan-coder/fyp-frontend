"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  DetailBackLink,
  InfoCard,
  InfoGrid,
  DetailSkeleton,
  type InfoItem,
} from "@/components/dashboard/detail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAsync } from "@/lib/useAsync";
import { useRefund } from "@/lib/features/fees/useFees";
import { studentsApi } from "@/lib/features/students";

const date = (v?: string | null) => (v ? String(v).slice(0, 10) : "—");
const money = (v?: string | number | null) => (v == null ? "—" : `₨ ${Number(v).toLocaleString()}`);

export default function RefundDetail() {
  const { id } = useParams<{ id: string }>();
  const { refund, loading } = useRefund(id);

  const studentId = refund?.student_id;
  const studentQ = useAsync(() => studentsApi.getById(studentId!), [studentId], {
    key: `students:${studentId}`,
    enabled: !!studentId,
  });

  if (loading && !refund) return <DetailSkeleton sections={3} />;
  if (!refund) {
    return (
      <>
        <DetailBackLink href="/admin/refunds" label="Back to refunds" />
        <p className="py-20 text-center text-sm text-muted-foreground">Refund not found.</p>
      </>
    );
  }

  const student = studentQ.data;
  const name = student?.user?.full_name ?? refund.student?.user?.full_name ?? "Resident";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const payment = refund.payment;

  const refundInfo: InfoItem[] = [
    { label: "Status", value: <StatusBadge status={refund.status} /> },
    { label: "Amount", value: money(refund.amount) },
    { label: "Reason", value: refund.reason ?? "—" },
    { label: "Remarks", value: refund.remarks ?? "—" },
    { label: "Approved by", value: refund.approver?.full_name ?? refund.approver?.email ?? "—" },
    { label: "Requested", value: date(refund.created_at) },
    { label: "Approved at", value: date(refund.approved_at) },
    { label: "Processed at", value: date(refund.processed_at) },
    { label: "Txn reference", value: refund.transaction_reference ?? "—" },
  ];

  const studentInfo: InfoItem[] = [
    { label: "Student ID", value: student?.student_id ?? refund.student?.student_id ?? "—" },
    { label: "Department", value: student?.department ?? "—" },
    { label: "Year", value: student?.year_of_study ? `Year ${student.year_of_study}` : "—" },
    { label: "Gender", value: student?.gender ?? "—" },
    { label: "Date of birth", value: date(student?.date_of_birth) },
    { label: "Blood group", value: student?.blood_group ?? "—" },
    { label: "Guardian", value: student?.guardian_name ?? "—" },
    { label: "Guardian phone", value: student?.guardian_phone ?? "—" },
    { label: "Address", value: student?.address ?? "—" },
  ];

  const paymentInfo: InfoItem[] = [
    { label: "Receipt #", value: payment?.receipt_number ?? "—" },
    { label: "Amount paid", value: money(payment?.amount_paid) },
    { label: "Payment ID", value: payment?.id ?? refund.payment_id ?? "—" },
  ];

  return (
    <>
      <DetailBackLink href="/admin/refunds" label="Back to refunds" />
      <PageHeader title={name} description="Refund detail — resident and related payment." />

      <div className="mx-auto w-full max-w-5xl space-y-4">
        <InfoCard title="Resident">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <Avatar className="size-20 shrink-0">
              {student?.profile_image_url && <AvatarImage src={student.profile_image_url} alt={name} />}
              <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground">{student?.student_id ?? refund.student?.student_id ?? "Resident"}</p>
            </div>
            <div className="space-y-2 text-sm sm:ml-auto sm:text-left">
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><Mail className="size-4 shrink-0" /> {student?.user?.email ?? refund.student?.user?.email ?? "—"}</p>
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><Phone className="size-4 shrink-0" /> {student?.user?.phone ?? "—"}</p>
            </div>
          </div>
        </InfoCard>

        <InfoCard title="Refund">
          <InfoGrid items={refundInfo} />
        </InfoCard>

        <InfoCard title="Related payment">
          <InfoGrid items={paymentInfo} />
        </InfoCard>

        <InfoCard title="Student profile" description="Information on file with administration">
          <InfoGrid items={studentInfo} />
        </InfoCard>
      </div>
    </>
  );
}
