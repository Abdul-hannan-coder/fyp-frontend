import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleGuard } from "@/components/auth/role-guard";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["student"]}>
      <DashboardShell role="student">{children}</DashboardShell>
    </RoleGuard>
  );
}
