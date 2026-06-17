"use client";

import * as React from "react";
import { NotificationPopover, type Notification } from "@/components/ui/notification-popover";
import { useAnnouncements } from "@/lib/features/announcements";

const READ_KEY = "sh_read_announcements";

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

/**
 * Surfaces the latest published announcements as header notifications. "Read"
 * state is kept client-side (localStorage) since the API has no per-user read
 * model — opening or clicking a notice marks it seen.
 */
export function HeaderNotifications() {
  const { announcements } = useAnnouncements("active");
  const [read, setRead] = React.useState<Set<string>>(() => new Set());

  // Hydrate read ids after mount to stay SSR-safe (server has no localStorage).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setRead(readSet()), []);

  const persist = (next: Set<string>) => {
    setRead(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(READ_KEY, JSON.stringify([...next]));
    }
  };

  const notifications: Notification[] = announcements.slice(0, 12).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.content,
    timestamp: new Date(a.published_at || a.createdAt || 0),
    read: read.has(a.id),
  }));

  return (
    <NotificationPopover
      notifications={notifications}
      onSelect={(id) => persist(new Set(read).add(id))}
      onMarkAllAsRead={() => persist(new Set(announcements.map((a) => a.id)))}
      emptyLabel="You're all caught up"
    />
  );
}
