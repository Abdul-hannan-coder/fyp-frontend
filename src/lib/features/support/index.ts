"use client";

import * as React from "react";
import { toast } from "sonner";
import { http, unwrapList } from "@/lib/http";
import { useAsync } from "@/lib/useAsync";

export type Ticket = {
  id: string;
  subject: string;
  category: string;
  description?: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt?: string;
  student?: { student_id?: string; user?: { full_name: string } };
};

export const supportApi = {
  list: () => http.get<unknown>("/support/tickets?limit=100").then((d) => unwrapList<Ticket>(d, "tickets")),
  mine: () => http.get<unknown>("/support/tickets/my?limit=100").then((d) => unwrapList<Ticket>(d, "tickets")),
  create: (body: { category: string; subject: string; description: string; priority: string }) =>
    http.post<Ticket>("/support/tickets", body),
  updateStatus: (id: string, status: string, admin_remarks?: string) =>
    http.patch<Ticket>(`/support/tickets/${id}/status`, { status, admin_remarks }),
  comments: (id: string) =>
    http.get<unknown>(`/support/tickets/${id}/comments`).then((d) => unwrapList<TicketComment>(d, "comments")),
  addComment: (id: string, comment: string) =>
    http.post<TicketComment>(`/support/tickets/${id}/comments`, { comment }),
};

export type TicketComment = {
  id: string;
  comment: string;
  createdAt?: string;
  author?: { full_name: string; role?: { name: string } };
  user?: { full_name: string };
};

export function useTicketComments(ticketId: string | null) {
  const q = useAsync(() => supportApi.comments(ticketId!), [ticketId], { enabled: !!ticketId });
  const [busy, setBusy] = React.useState(false);

  const add = async (comment: string) => {
    if (!ticketId) return false;
    setBusy(true);
    try {
      await supportApi.addComment(ticketId, comment);
      await q.refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { comments: q.data ?? [], loading: q.loading, busy, add };
}

export function useSupport(scope: "all" | "mine" = "all") {
  const q = useAsync(() => (scope === "mine" ? supportApi.mine() : supportApi.list()), [scope]);
  const [busy, setBusy] = React.useState<string | null>(null);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      await supportApi.updateStatus(id, status);
      toast.success("Ticket updated");
      await q.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const create = async (body: { category: string; subject: string; description: string; priority: string }) => {
    try {
      await supportApi.create(body);
      toast.success("Ticket created");
      await q.refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    }
  };

  return { tickets: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch, busyId: busy, setStatus, create };
}
