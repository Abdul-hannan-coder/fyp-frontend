"use client";

import * as React from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SkeletonCards } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TicketCreateDialog } from "@/components/dialogs/ticket-create-dialog";
import { TicketDetailDialog } from "@/components/dialogs/ticket-detail-dialog";
import { useSupport, type Ticket } from "@/lib/features/support";

export default function StudentSupport() {
  const { tickets, loading, error, create } = useSupport("mine");
  const [selected, setSelected] = React.useState<Ticket | null>(null);

  return (
    <>
      <PageHeader title="Support" description="Raise complaints and track their status.">
        <TicketCreateDialog onCreate={create} />
      </PageHeader>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      {loading ? (
        <SkeletonCards count={4} />
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            You haven&apos;t raised any tickets yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => setSelected(t)}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-medium text-primary">
                    {t.id.slice(0, 4)}
                  </div>
                  <div>
                    <p className="font-medium">{t.subject}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="font-normal capitalize">{t.category.replace(/_/g, " ")}</Badge>
                      <span className="capitalize">{t.priority}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TicketDetailDialog ticket={selected} onClose={() => setSelected(null)} />
    </>
  );
}
