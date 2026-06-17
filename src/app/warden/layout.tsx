import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleGuard } from "@/components/auth/role-guard";

export default function WardenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["warden", "staff"]}>
      <DashboardShell role="warden">{children}</DashboardShell>
    </RoleGuard>
  );
}
