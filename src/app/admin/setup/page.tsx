"use client";

import Link from "next/link";
import { ArrowRight, Building2, DoorOpen, Layers, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoomsAdmin } from "@/lib/features/rooms";
import { useAmenities } from "@/lib/features/amenities";

export default function AdminSetupOverview() {
  const s = useRoomsAdmin();
  const am = useAmenities();

  const cards = [
    { href: "/admin/setup/amenities", icon: Sparkles, title: "Amenities", count: am.amenities.length, desc: "Priced add-ons attached to room types." },
    { href: "/admin/setup/blocks", icon: Building2, title: "Blocks", count: s.blocks.length, desc: "Residential blocks of the hostel." },
    { href: "/admin/setup/floors", icon: Layers, title: "Floors", count: s.floors.length, desc: "Floors within each block." },
    { href: "/admin/setup/rooms", icon: DoorOpen, title: "Rooms & Types", count: s.rooms.length, desc: "Create rooms with photos + amenities, and manage room types." },
  ];

  return (
    <>
      <PageHeader title="Hostel setup" description="Build your hostel: amenities → blocks → floors → room types → rooms. Manage each from its own page." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="size-5" />
                  </div>
                  <span className="font-heading text-2xl font-semibold">{c.count}</span>
                </div>
                <CardTitle className="mt-3 flex items-center gap-1.5 text-base">
                  {c.title}
                  <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </CardTitle>
                <CardDescription>{c.desc}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
