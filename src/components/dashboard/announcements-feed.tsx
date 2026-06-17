"use client";

import { Check, Megaphone, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SkeletonCards } from "@/components/ui/skeleton";
import Markdown from "@/components/ui/Markdown";
import { useAnnouncements } from "@/lib/features/announcements";

export function AnnouncementsFeed({
  scope = "active",
  showMarkRead = false,
}: {
  scope?: "admin" | "active";
  showMarkRead?: boolean;
}) {
  const { announcements, loading, error, markRead } = useAnnouncements(scope);

  if (loading) return <SkeletonCards count={4} />;
  if (error)
    return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>;
  if (announcements.length === 0)
    return <p className="py-10 text-center text-sm text-muted-foreground">No announcements yet.</p>;

  return (
    <ScrollArea className="max-h-[28rem] pr-3">
      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Megaphone className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{a.title}</p>
                {a.is_pinned && (
                  <Badge variant="outline" className="gap-1 border-warning/30 bg-warning/10 text-gold-foreground">
                    <Pin className="size-3" /> Pinned
                  </Badge>
                )}
              </div>
              <div className="mt-1 text-muted-foreground">
                <Markdown>{a.content}</Markdown>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                {a.category && <Badge variant="secondary" className="font-normal capitalize">{a.category}</Badge>}
                <span>{(a.published_at || a.createdAt || "").slice(0, 10)}</span>
                {showMarkRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 px-2 text-xs"
                    onClick={() => markRead(a.id)}
                  >
                    <Check className="size-3.5" /> Mark as read
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
