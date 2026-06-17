"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { MessWeek } from "@/components/dashboard/mess-week";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMessPlans } from "@/lib/features/mess";

export default function WardenMess() {
  const { plans } = useMessPlans(true);
  const active = plans.filter((p) => !p.status || p.status === "active").length;

  return (
    <>
      <PageHeader title="Mess" description="Menus and subscription plans overview." />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Plans offered" value={String(plans.length)} hint="total" />
        <StatCard label="Active plans" value={String(active)} hint="available to residents" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This week&apos;s menu</CardTitle>
          <CardDescription>Current weekly rotation</CardDescription>
        </CardHeader>
        <CardContent>
          <MessWeek />
        </CardContent>
      </Card>
    </>
  );
}
