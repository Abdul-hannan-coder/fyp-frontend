"use client";

import { BedDouble, Loader2, MapPin, Wind } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { useMyAllocation } from "@/lib/features/allocation/useAllocation";

const amenities = ["Air conditioning", "Attached bathroom", "Study desk", "Wardrobe", "Wi-Fi", "Housekeeping"];

export default function StudentRoom() {
  const { allocation, loading, error } = useMyAllocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading your room…
      </div>
    );
  }

  if (error || !allocation) {
    return (
      <>
        <PageHeader title="My room" description="Everything about your accommodation." />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <BedDouble className="size-6" />
            </div>
            <div>
              <p className="font-medium">No room allocated yet</p>
              <p className="text-sm text-muted-foreground">Reserve and pay to confirm your room.</p>
            </div>
            <ButtonLink href="/student/booking">Complete booking</ButtonLink>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My room" description="Everything about your accommodation." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-heading text-2xl">Room {allocation.room?.room_number ?? "—"}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="size-3" /> {allocation.room?.roomType?.name ?? "Room"} · {allocation.academic_year}
                </CardDescription>
              </div>
              <StatusBadge status={allocation.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex h-40 items-center justify-center rounded-xl border bg-gradient-to-br from-primary/10 to-gold/10">
              <BedDouble className="size-12 text-primary/40" />
            </div>
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Wind className="size-4 text-primary" /> Amenities
              </p>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <Badge key={a} variant="secondary" className="font-normal">{a}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Room", allocation.room?.room_number ?? "—"],
              ["Type", allocation.room?.roomType?.name ?? "—"],
              ["Bed", allocation.bed_number ? `Bed ${allocation.bed_number}` : "—"],
              ["Term", `${allocation.academic_year} · ${allocation.semester}`],
              ["Check-in", allocation.check_in_date ?? "Pending payment"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
