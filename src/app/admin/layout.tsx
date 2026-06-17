import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleGuard } from "@/components/auth/role-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["admin"]}>
      <DashboardShell role="admin">{children}</DashboardShell>
    </RoleGuard>
  );
}
