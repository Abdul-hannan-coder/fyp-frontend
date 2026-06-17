"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { AnnouncementsFeed } from "@/components/dashboard/announcements-feed";
import { AnnouncementCreateDialog } from "@/components/dashboard/announcement-create-dialog";
import { useAnnouncements } from "@/lib/features/announcements";

export default function WardenAnnouncements() {
  const { busy, create } = useAnnouncements("admin");

  return (
    <>
      <PageHeader title="Announcements" description="Notices for your residents.">
        <AnnouncementCreateDialog busy={busy} onCreate={create} />
      </PageHeader>
      <AnnouncementsFeed scope="admin" />
    </>
  );
}
