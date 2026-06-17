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
import { useAllocation } from "@/lib/features/allocation/useAllocation";
import { studentsApi } from "@/lib/features/students";
import { roomsApi } from "@/lib/features/rooms";
import { feesApi } from "@/lib/features/fees/api";

const date = (v?: string | null) => (v ? String(v).slice(0, 10) : "—");
const money = (v?: string | number | null) => (v == null ? "—" : `Rs ${Number(v).toLocaleString()}`);

export default function AllocationDetail() {
  const { id } = useParams<{ id: string }>();
  const { allocation, loading } = useAllocation(id);

  const studentId = allocation?.student?.id;
  const studentQ = useAsync(() => studentsApi.getById(studentId!), [studentId], {
    key: `students:${studentId}`,
    enabled: !!studentId,
  });
  const roomsQ = useAsync(() => roomsApi.rooms(), [], { key: "rooms:list" });
  const paymentsQ = useAsync(() => feesApi.listPayments({ student_id: studentId }), [studentId], {
    key: `fees:student:${studentId}`,
    enabled: !!studentId,
  });

  if (loading && !allocation) return <DetailSkeleton sections={4} />;
  if (!allocation) {
    return (
      <>
        <DetailBackLink href="/admin/allocations" label="Back to allocations" />
        <p className="py-20 text-center text-sm text-muted-foreground">Allocation not found.</p>
      </>
    );
  }

  const student = studentQ.data;
  const room = (roomsQ.data ?? []).find((r) => r.id === allocation.room_id) ?? null;
  const payments = paymentsQ.data ?? [];
  const name = student?.user?.full_name ?? allocation.student?.user?.full_name ?? "Resident";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");

  const allocationInfo: InfoItem[] = [
    { label: "Status", value: <StatusBadge status={allocation.status} /> },
    { label: "Academic year", value: allocation.academic_year ?? "—" },
    { label: "Semester", value: allocation.semester ?? "—" },
    { label: "Bed number", value: allocation.bed_number ?? "—" },
    { label: "Allocated on", value: date(allocation.allocation_date) },
    { label: "Check-in", value: date(allocation.check_in_date) },
    { label: "Expected checkout", value: date(allocation.expected_checkout_date) },
    { label: "Actual checkout", value: date(allocation.actual_checkout_date) },
  ];

  const studentInfo: InfoItem[] = [
    { label: "Student ID", value: student?.student_id ?? allocation.student?.student_id ?? "—" },
    { label: "Department", value: student?.department ?? "—" },
    { label: "Year", value: student?.year_of_study ? `Year ${student.year_of_study}` : "—" },
    { label: "Gender", value: student?.gender ?? "—" },
    { label: "Date of birth", value: date(student?.date_of_birth) },
    { label: "Blood group", value: student?.blood_group ?? "—" },
    { label: "Guardian", value: student?.guardian_name ?? "—" },
    { label: "Guardian phone", value: student?.guardian_phone ?? "—" },
    { label: "Address", value: student?.address ?? "—" },
  ];

  const roomInfo: InfoItem[] = [
    { label: "Room number", value: room?.room_number ?? allocation.room?.room_number ?? "—" },
    { label: "Room type", value: room?.roomType?.name ?? allocation.room?.roomType?.name ?? "—" },
    { label: "Block", value: room?.block?.name ?? "—" },
    { label: "Capacity", value: room?.capacity ?? "—" },
    { label: "Occupancy", value: room?.current_occupancy != null ? `${room.current_occupancy}/${room.capacity ?? "—"}` : "—" },
    { label: "Status", value: room ? <StatusBadge status={room.status} /> : "—" },
    { label: "Base price", value: money(room?.base_price) },
    { label: "Total price", value: money(room?.total_price) },
  ];

  return (
    <>
      <DetailBackLink href="/admin/allocations" label="Back to allocations" />
      <PageHeader title={name} description="Allocation detail — resident, room and fees." />

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
              <p className="text-sm text-muted-foreground">{student?.student_id ?? allocation.student?.student_id ?? "Resident"}</p>
            </div>
            <div className="space-y-2 text-sm sm:ml-auto sm:text-left">
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><Mail className="size-4 shrink-0" /> {student?.user?.email ?? "—"}</p>
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"><Phone className="size-4 shrink-0" /> {student?.user?.phone ?? "—"}</p>
            </div>
          </div>
        </InfoCard>

        <InfoCard title="Allocation">
          <InfoGrid items={allocationInfo} />
        </InfoCard>

        <InfoCard title="Student profile" description="Information on file with administration">
          {studentQ.loading && !student ? (
            <InfoGridSkeleton />
          ) : (
            <InfoGrid items={studentInfo} />
          )}
        </InfoCard>

        <InfoCard title="Room">
          {roomsQ.loading && !room ? <InfoGridSkeleton /> : <InfoGrid items={roomInfo} />}
        </InfoCard>

        <InfoCard title="Fees & payments" description="All payments raised for this resident">
          {paymentsQ.loading && payments.length === 0 ? (
            <InfoGridSkeleton />
          ) : payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.feeStructure?.name ?? p.feeStructure?.fee_type ?? "Fee"}</TableCell>
                    <TableCell>{money(p.total_amount ?? p.amount_due)}</TableCell>
                    <TableCell>{money(p.amount_paid)}</TableCell>
                    <TableCell className="text-muted-foreground">{date(p.due_date)}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={p.status} /></TableCell>
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
