"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NAV, ROLE_META, type Role } from "@/lib/nav";

const ROLES: Role[] = ["admin", "warden", "student"];

// Map every known dashboard href to its human label (taken from the sidebar nav),
// so breadcrumbs read the same words the user clicked to get here.
const HREF_LABEL: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const role of ROLES) {
    map[ROLE_META[role].home] = "Dashboard";
    for (const section of NAV[role]) {
      for (const item of section.items) map[item.href] = item.label;
    }
  }
  return map;
})();

function prettify(segment: string): string {
  // Ids (uuids / numbers) get a generic label rather than a raw key.
  if (/^[0-9a-f]{8,}$/i.test(segment) || /^\d+$/.test(segment)) return "Detail";
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function useCrumbs() {
  const pathname = usePathname();
  const crumbs: { href: string; label: string }[] = [];
  let acc = "";
  for (const seg of pathname.split("/").filter(Boolean)) {
    acc += `/${seg}`;
    crumbs.push({ href: acc, label: HREF_LABEL[acc] ?? prettify(seg) });
  }
  return crumbs;
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const crumbs = useCrumbs();

  return (
    <div className="space-y-3">
      {crumbs.length > 1 && (
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <React.Fragment key={c.href}>
                  <BreadcrumbItem>
                    {last ? (
                      <BreadcrumbPage>{c.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={c.href} />}>{c.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!last && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
