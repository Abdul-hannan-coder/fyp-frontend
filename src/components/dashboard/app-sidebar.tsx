"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/logo";
import { NAV, ROLE_META, type Role } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const meta = ROLE_META[role];

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/60 p-4">
        <Link href={meta.home} className="text-sidebar-foreground">
          <Logo />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {NAV[role].map((section, i) => (
          <SidebarGroup key={i}>
            {section.heading && (
              <SidebarGroupLabel className="text-sidebar-foreground/50">
                {section.heading}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active =
                    item.href === meta.home
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        tooltip={item.label}
                        className={cn(
                          "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          active &&
                            "bg-sidebar-accent font-medium text-sidebar-primary hover:text-sidebar-primary border-l-2 border-sidebar-primary rounded-l-sm",
                        )}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <p className="px-2 text-xs text-sidebar-foreground/50">
          {meta.label} workspace
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
