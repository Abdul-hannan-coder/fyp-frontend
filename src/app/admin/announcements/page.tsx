"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { AnnouncementsFeed } from "@/components/dashboard/announcements-feed";
import { AnnouncementCreateDialog } from "@/components/dashboard/announcement-create-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnnouncements, useAnnouncementAnalytics } from "@/lib/features/announcements";

export default function AdminAnnouncements() {
  const { announcements, busy, create } = useAnnouncements("admin");
  const { analytics } = useAnnouncementAnalytics();

  const published = announcements.filter((a) => a.status === "published" || a.published_at).length;
  const drafts = announcements.length - published;

  return (
    <>
      <PageHeader title="Announcements" description="Broadcast notices to residents and staff.">
        <AnnouncementCreateDialog busy={busy} onCreate={create} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={String(analytics?.total ?? announcements.length)} hint="all announcements" />
        <StatCard label="Published" value={String(analytics?.published ?? published)} hint="live now" />
        <StatCard label="Drafts" value={String(analytics?.draft ?? drafts)} hint="not yet published" />
      </div>

      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <Stat label="Scheduled" value={analytics.scheduled} />
              <Stat label="Archived" value={analytics.archived} />
              <Stat label="Total reads" value={analytics.readCount} />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">By category</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analytics.byCategory).map(([cat, count]) => (
                  <Badge key={cat} variant="secondary" className="font-normal capitalize">
                    {cat.replace("_", " ")}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AnnouncementsFeed scope="admin" />
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
