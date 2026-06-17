import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { HeaderNotifications } from "@/components/dashboard/header-notifications";
import { ModernSidebar } from "@/components/ui/modern-side-bar";
import { ROLE_META, type Role } from "@/lib/nav";

export function DashboardShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const meta = ROLE_META[role];

  return (
    <div className="flex min-h-screen w-full">
      <ModernSidebar role={role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-4 pl-16 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:pl-4">
          <div className="leading-tight">
            <p className="text-sm font-semibold">{meta.label} workspace</p>
            <p className="text-xs text-muted-foreground">{meta.description}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <HeaderNotifications />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
