"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Timeline,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from "@/components/ui/timeline";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTicketComments, type Ticket } from "@/lib/features/support";

// A support ticket moves open → in progress → resolved; "closed" is terminal too.
const STATUS_RANK: Record<string, number> = { open: 0, in_progress: 1, resolved: 2, closed: 2 };
const STEPS = [
  { label: "Raised", rank: 0 },
  { label: "In progress", rank: 1 },
  { label: "Resolved", rank: 2 },
];

export function TicketDetailDialog({
  ticket,
  onClose,
  canManage = false,
  busy = false,
  onStatus,
}: {
  ticket: Ticket | null;
  onClose: () => void;
  canManage?: boolean;
  busy?: boolean;
  onStatus?: (id: string, status: string) => void;
}) {
  const { comments, loading, busy: commenting, add } = useTicketComments(ticket?.id ?? null);
  const [text, setText] = React.useState("");

  const send = async () => {
    if (!text.trim()) return;
    const ok = await add(text.trim());
    if (ok) setText("");
  };

  return (
    <Dialog open={!!ticket} onOpenChange={(o) => !o && onClose()}>
      {ticket && (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{ticket.subject}</DialogTitle>
            <DialogDescription>
              {ticket.student?.user?.full_name ?? "Resident"} · raised {(ticket.createdAt || "").slice(0, 10)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <Badge variant="secondary" className="font-normal capitalize">{ticket.category?.replace(/_/g, " ")}</Badge>
            <Badge variant="outline" className="font-normal capitalize">{ticket.priority}</Badge>
          </div>

          {ticket.description && (
            <p className="rounded-lg border bg-muted/40 p-3 text-sm">{ticket.description}</p>
          )}

          <Timeline positions="left" className="pl-1">
            {STEPS.map((s, i) => {
              const rank = STATUS_RANK[ticket.status] ?? 0;
              const last = i === STEPS.length - 1;
              const dot = rank > s.rank ? "done" : rank === s.rank ? "current" : "default";
              return (
                <TimelineItem key={s.label} status={rank >= s.rank ? "done" : "default"}>
                  <TimelineDot status={dot} />
                  {!last && <TimelineLine done={rank > s.rank} />}
                  <TimelineHeading variant={rank >= s.rank ? "primary" : "secondary"}>
                    {s.label}
                  </TimelineHeading>
                </TimelineItem>
              );
            })}
          </Timeline>

          {canManage && ticket.status !== "resolved" && ticket.status !== "closed" && onStatus && (
            <div className="flex gap-2">
              {ticket.status === "open" && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => { onStatus(ticket.id, "in_progress"); onClose(); }}>
                  Start working
                </Button>
              )}
              <Button size="sm" disabled={busy} onClick={() => { onStatus(ticket.id, "resolved"); onClose(); }}>
                Mark resolved
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Conversation</p>
            <ScrollArea className="max-h-48 pr-3">
             <div className="space-y-2">
              {loading ? (
                <div className="space-y-2 py-1">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-5/6 rounded-lg" />
                </div>
              ) : comments.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-lg border p-2.5 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                      {c.author?.full_name ?? c.user?.full_name ?? "User"}
                      {c.createdAt && ` · ${c.createdAt.slice(0, 10)}`}
                    </p>
                    <p className="mt-0.5">{c.comment}</p>
                  </div>
                ))
              )}
             </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…"
                onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
              <Button size="icon" disabled={!text.trim() || commenting} onClick={send}>
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
