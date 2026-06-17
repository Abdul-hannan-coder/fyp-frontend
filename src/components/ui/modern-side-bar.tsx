"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, LogOut, Menu, Search, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NAV, ROLE_META, type Role } from "@/lib/nav";
import { useAuth } from "@/lib/features/auth/useAuth";
import { studentsApi } from "@/lib/features/students";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Modern collapsible sidebar — wired to the app's role-based navigation,
 * Next.js routing (active state via usePathname), and real auth (profile +
 * logout). Styled with design-system tokens so it respects the brand and
 * dark mode.
 */
export function ModernSidebar({ role, className = "" }: { role: Role; className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const meta = ROLE_META[role];

  const [isOpen, setIsOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [openKeys, setOpenKeys] = React.useState<string[]>([]);
  const toggleKey = (key: string) =>
    setOpenKeys((k) => (k.includes(key) ? k.filter((x) => x !== key) : [...k, key]));

  // Auto-open on desktop, closed drawer on mobile.
  React.useEffect(() => {
    const handle = () => setIsOpen(window.innerWidth >= 768);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const sections = NAV[role]
    .map((s) => ({
      ...s,
      items: s.items.filter((it) => it.label.toLowerCase().includes(query.toLowerCase())),
    }))
    .filter((s) => s.items.length > 0);

  const onNavigate = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setIsOpen(false);
  };

  const onLogout = async () => {
    await logout();
    toast.success("Signed out");
    router.push("/login");
  };

  const name = user?.full_name ?? meta.label;
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");

  // Students have a profile page + an uploadable photo (kept on their record).
  const profileHref = role === "student" ? "/student/profile" : null;
  const photo = useSidebarPhoto(role);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed left-4 top-3.5 z-50 rounded-lg border bg-card p-2.5 shadow-sm transition-colors hover:bg-muted md:hidden"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="size-5 text-muted-foreground" /> : <Menu className="size-5 text-muted-foreground" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out md:sticky md:top-0 md:z-auto md:h-screen md:shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "w-20" : "w-72",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sidebar-border/60 p-4">
          <Link href={meta.home} onClick={onNavigate} className={cn("flex items-center gap-2.5", isCollapsed && "mx-auto")}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              SH
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-base font-semibold">Second Home</span>
                <span className="text-xs text-muted-foreground">{meta.label} workspace</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="hidden rounded-md p-1.5 transition-colors hover:bg-sidebar-accent md:flex"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="size-4 text-muted-foreground" /> : <ChevronLeft className="size-4 text-muted-foreground" />}
          </button>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="px-3 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search menu…"
                className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="scroll-slim flex-1 overflow-y-auto px-3 py-1">
          {sections.map((section, i) => (
            <div key={i} className="mb-3">
              {section.heading && !isCollapsed && (
                <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{section.heading}</p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  const hasChildren = !!item.children?.length && !isCollapsed;

                  if (hasChildren) {
                    const childActive = item.children!.some((c) => pathname === c.href);
                    const branchActive = pathname.startsWith(item.href);
                    const expanded = openKeys.includes(item.href) || branchActive;
                    return (
                      <li key={item.href}>
                        <button
                          type="button"
                          onClick={() => toggleKey(item.href)}
                          className={cn(
                            "group flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors",
                            childActive || branchActive
                              ? "font-medium text-sidebar-primary"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          )}
                        >
                          <Icon className={cn("size-4 shrink-0", childActive || branchActive ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", expanded && "rotate-180")} />
                        </button>
                        {expanded && (
                          <ul className="mt-0.5 space-y-0.5 border-l border-sidebar-border/60 pl-3 ml-4">
                            {item.children!.map((child) => {
                              const ChildIcon = child.icon;
                              const cActive = pathname === child.href;
                              return (
                                <li key={child.href}>
                                  <Link
                                    href={child.href}
                                    onClick={onNavigate}
                                    className={cn(
                                      "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                                      cActive
                                        ? "bg-sidebar-primary/10 font-medium text-sidebar-primary"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                                    )}
                                  >
                                    <ChildIcon className={cn("size-4 shrink-0", cActive ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                                    <span>{child.label}</span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-sidebar-primary/10 font-medium text-sidebar-primary"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          isCollapsed && "justify-center px-2",
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", active ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                        {!isCollapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {sections.length === 0 && !isCollapsed && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">No matches.</p>
          )}
        </nav>

        {/* Profile dropdown */}
        <div className="mt-auto border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title={isCollapsed ? name : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50",
                  isCollapsed ? "justify-center p-1.5" : "px-2 py-2",
                )}
              >
                <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={name} className="size-full object-cover" />
                  ) : (
                    initials
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-success ring-2 ring-sidebar" title="Online" />
                </div>
                {!isCollapsed && (
                  <>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email ?? meta.label}</p>
                    </div>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium text-foreground">{name}</p>
                <p className="truncate text-xs font-normal">{user?.email ?? meta.label}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profileHref && (
                <DropdownMenuItem asChild>
                  <Link href={profileHref} onClick={onNavigate}>
                    <UserRound className="size-4" /> View profile
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                <LogOut className="size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}

/**
 * Loads the signed-in student's profile photo for the sidebar avatar. Only
 * students have a photo (kept on their student record); other roles skip the
 * fetch entirely. The sidebar mounts once per session, so this runs once.
 */
function useSidebarPhoto(role: Role): string | null {
  const [photo, setPhoto] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (role !== "student") return;
    let active = true;
    studentsApi
      .list()
      .then((rows) => { if (active) setPhoto(rows[0]?.profile_image_url ?? null); })
      .catch(() => { /* avatar falls back to initials */ });
    return () => { active = false; };
  }, [role]);

  return photo;
}
