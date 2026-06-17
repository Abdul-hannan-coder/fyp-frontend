"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
};

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onSelect: (id: string) => void;
}

const NotificationItem = ({ notification, index, onSelect }: NotificationItemProps) => (
  <motion.button
    type="button"
    initial={{ opacity: 0, x: 12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2, delay: index * 0.04 }}
    onClick={() => onSelect(notification.id)}
    className="w-full p-4 text-left transition-colors hover:bg-accent cursor-pointer"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
        <h4 className="truncate text-[13px] font-bold text-foreground">{notification.title}</h4>
      </div>
      <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
        {notification.timestamp.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
      </span>
    </div>
    <p className="mt-1 text-xs font-medium text-muted-foreground leading-snug line-clamp-2">{notification.description}</p>
  </motion.button>
);

interface NotificationPopoverProps {
  notifications: Notification[];
  onMarkAllAsRead?: () => void;
  onSelect?: (id: string) => void;
  emptyLabel?: string;
}

export function NotificationPopover({
  notifications,
  onMarkAllAsRead,
  onSelect,
  emptyLabel = "No notifications",
}: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={() => setIsOpen((o) => !o)}
        title={`${unreadCount} alert${unreadCount > 1 ? "s" : ""}`}
        className={cn(
          "relative h-10 w-10",
          unreadCount > 0 && "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
        )}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[8px] font-extrabold text-primary-foreground ring-2 ring-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-3 top-[4.5rem] z-[60] max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:max-h-[60vh] sm:w-80"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Notifications</h3>
              {notifications.length > 0 && onMarkAllAsRead && (
                <Button
                  type="button"
                  onClick={onMarkAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] font-bold text-primary hover:bg-primary/5"
                >
                  Mark all as read
                </Button>
              )}
            </div>

            {notifications.length > 0 ? (
              <div className="divide-y divide-border">
                {notifications.map((n, i) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    index={i}
                    onSelect={(id) => { onSelect?.(id); setIsOpen(false); }}
                  />
                ))}
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-xs font-semibold italic text-muted-foreground">{emptyLabel}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
