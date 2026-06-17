"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DetailBackLink, InfoCard, InfoGrid, DetailSkeleton, type InfoItem } from "@/components/dashboard/detail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAsync } from "@/lib/useAsync";
import { useTransfer } from "@/lib/features/allocation/useTransfers";
import { studentsApi } from "@/lib/features/students";
import { roomsApi, type Room } from "@/lib/features/rooms";

const date = (v?: string | null) => (v ? String(v).slice(0, 10) : "—");
const money = (v?: string | number | null) => (v == null ? "—" : `Rs ${Number(v).toLocaleString()}`);

function roomItems(room: Room | null, fallbackNumber?: string | null): InfoItem[] {
  return [
    { label: "Room number", value: room?.room_number ?? fallbackNumber ?? "—" },
    { label: "Room type", value: room?.roomType?.name ?? "—" },
    { label: "Block", value: room?.block?.name ?? room?.floor?.block?.name ?? "—" },
    { label: "Capacity", value: room?.capacity ?? room?.roomType?.capacity ?? "—" },
    {
      label: "Occupancy",
      value: room?.current_occupancy != null ? `${room.current_occupancy}/${room.capacity ?? "—"}` : "—",
    },
    { label: "Status", value: room ? <StatusBadge status={room.status} /> : "—" },
    { label: "Base price", value: money(room?.base_price ?? room?.roomType?.base_price) },
    { label: "Total price", value: money(room?.total_price) },
  ];
}

export default function TransferDetail() {
  const { id } = useParams<{ id: string }>();
  const { transfer, loading } = useTransfer(id);

  const studentId = transfer?.student?.id;
  const studentQ = useAsync(() => studentsApi.getById(studentId!), [studentId], {
    key: `students:${studentId}`,
    enabled: !!studentId,
  });
  const roomsQ = useAsync(() => roomsApi.rooms(), [], { key: "rooms:list" });

  if (loading && !transfer) return <DetailSkeleton sections={4} />;
  if (!transfer) {
    return (
      <>
        <DetailBackLink href="/admin/transfers" label="Back to transfers" />
        <p className="py-20 text-center text-sm text-muted-foreground">Transfer not found.</p>
      </>
    );
  }

  const student = studentQ.data;
  const rooms = roomsQ.data ?? [];
  const fromRoom = rooms.find((r) => r.id === transfer.from_room_id) ?? null;
  const toRoom = transfer.to_room_id ? rooms.find((r) => r.id === transfer.to_room_id) ?? null : null;

  const name =
    student?.user?.full_name ?? transfer.student?.user?.full_name ?? transfer.student?.student_id ?? "Resident";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");

  const transferInfo: InfoItem[] = [
    { label: "Status", value: <StatusBadge status={transfer.status} /> },
    {
      label: "Move",
      value: (
        <span className="inline-flex items-center gap-1.5">
          <span>{transfer.fromRoom?.room_number ?? fromRoom?.room_number ?? "—"}</span>
          <ArrowRight className="size-3.5 text-muted-foreground" />
          <span>{transfer.toRoom?.room_number ?? toRoom?.room_number ?? transfer.preferredRoomType?.name ?? "Any"}</span>
        </span>
      ),
    },
    { label: "Preferred type", value: transfer.preferredRoomType?.name ?? "—" },
    { label: "Requested on", value: date(transfer.created_at) },
    { label: "Reviewed on", value: date(transfer.reviewed_at) },
    { label: "Transfer date", value: date(transfer.transfer_date) },
    { label: "Reason", value: transfer.reason ?? "—" },
    { label: "Admin remarks", value: transfer.admin_remarks ?? "—" },
  ];

  const studentInfo: InfoItem[] = [
    { label: "Student ID", value: student?.student_id ?? transfer.student?.student_id ?? "—" },
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
      <DetailBackLink href="/admin/transfers" label="Back to transfers" />
      <PageHeader title={name} description="Room transfer detail — resident, rooms and status." />

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
              <p className="text-sm text-muted-foreground">{student?.student_id ?? transfer.student?.student_id ?? "Resident"}</p>
            </div>
            <div className="space-y-2 text-sm sm:ml-auto sm:text-left">
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start">
                <Mail className="size-4 shrink-0" /> {student?.user?.email ?? transfer.student?.user?.email ?? "—"}
              </p>
              <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start">
                <Phone className="size-4 shrink-0" /> {student?.user?.phone ?? "—"}
              </p>
            </div>
          </div>
        </InfoCard>

        <InfoCard title="Transfer">
          <InfoGrid items={transferInfo} />
        </InfoCard>

        <InfoCard title="Student profile" description="Information on file with administration">
          {studentQ.loading && !student ? <InfoGridSkeleton /> : <InfoGrid items={studentInfo} />}
        </InfoCard>

        <InfoCard title="From room" description="Resident's current room">
          {roomsQ.loading && !fromRoom ? (
            <InfoGridSkeleton />
          ) : (
            <InfoGrid items={roomItems(fromRoom, transfer.fromRoom?.room_number)} />
          )}
        </InfoCard>

        <InfoCard title="To room" description={toRoom || transfer.toRoom ? "Requested destination room" : "No specific room requested"}>
          {roomsQ.loading && !toRoom && transfer.to_room_id ? (
            <InfoGridSkeleton />
          ) : toRoom || transfer.toRoom ? (
            <InfoGrid items={roomItems(toRoom, transfer.toRoom?.room_number)} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {transfer.preferredRoomType?.name
                ? `Preferred room type: ${transfer.preferredRoomType.name}`
                : "No destination room or preferred type specified."}
            </p>
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
