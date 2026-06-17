import { PageHeader } from "@/components/dashboard/page-header";
import { AnnouncementsFeed } from "@/components/dashboard/announcements-feed";

export default function StudentAnnouncements() {
  return (
    <>
      <PageHeader title="Notices" description="Announcements from your hostel administration." />
      <AnnouncementsFeed showMarkRead />
    </>
  );
}
