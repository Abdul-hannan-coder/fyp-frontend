"use client";

import * as React from "react";
import { toast } from "sonner";
import { http, unwrapList } from "@/lib/http";
import { useAsync } from "@/lib/useAsync";

export type Announcement = {
  id: string;
  title: string;
  content: string;
  category?: string;
  priority?: string;
  status?: string;
  is_pinned?: boolean;
  createdAt?: string;
  published_at?: string;
};

export const ANNOUNCEMENT_CATEGORIES = [
  "general",
  "maintenance",
  "event",
  "rule_change",
  "emergency",
  "important",
] as const;
export const ANNOUNCEMENT_PRIORITIES = ["low", "medium", "high"] as const;

export type CreateAnnouncementInput = {
  title: string;
  content: string;
  category?: string;
  priority?: string;
  publish?: boolean;
};

export type AnnouncementAnalytics = {
  total: number;
  published: number;
  scheduled: number;
  draft: number;
  archived: number;
  byCategory: Record<string, number>;
  readCount: number;
  readByAnnouncement: { announcement_id: string; count: number | string }[];
};

export const announcementsApi = {
  adminList: () => http.get<unknown>("/announcements/admin?limit=100").then((d) => unwrapList<Announcement>(d, "announcements")),
  active: () => http.get<unknown>("/announcements?limit=100").then((d) => unwrapList<Announcement>(d, "announcements")),
  myFloor: () => http.get<unknown>("/announcements/my-floor?limit=100").then((d) => unwrapList<Announcement>(d, "announcements")),
  byCategory: (category: string) =>
    http.get<unknown>(`/announcements/by-category/${category}?limit=100`).then((d) => unwrapList<Announcement>(d, "announcements")),
  create: (body: { title: string; content: string; category?: string; priority?: string }) =>
    http.post<Announcement>("/announcements", body),
  publish: (id: string) => http.patch<Announcement>(`/announcements/${id}/publish`),
  markRead: (id: string) => http.post<unknown>(`/announcements/${id}/mark-read`),
  adminAnalytics: () => http.get<AnnouncementAnalytics>("/announcements/admin/analytics"),
};

export function useAnnouncements(scope: "admin" | "active" = "active") {
  const q = useAsync(() => (scope === "admin" ? announcementsApi.adminList() : announcementsApi.active()), [scope]);
  const [busy, setBusy] = React.useState(false);

  const create = async (input: CreateAnnouncementInput) => {
    setBusy(true);
    try {
      const { publish, ...body } = input;
      const created = await announcementsApi.create(body);
      // Optionally publish immediately so it reaches residents.
      if (publish && created?.id) await announcementsApi.publish(created.id);
      toast.success(publish ? "Announcement published" : "Announcement saved as draft");
      await q.refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await announcementsApi.markRead(id);
      toast.success("Marked as read");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    }
  };

  return { announcements: q.data ?? [], loading: q.loading, error: q.error, refetch: q.refetch, busy, create, markRead };
}

/** Admin-only announcement analytics (counts by status / category, reads). */
export function useAnnouncementAnalytics() {
  const q = useAsync(() => announcementsApi.adminAnalytics(), []);
  return { analytics: q.data, loading: q.loading, error: q.error, refetch: q.refetch };
}
