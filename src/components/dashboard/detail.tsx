"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Back link shown above a detail page header.
export function DetailBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> {label}
    </Link>
  );
}

// A titled card for one section of a detail page.
export function InfoCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className={action ? "flex-row items-center justify-between" : undefined}>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export type InfoItem = { label: string; value: React.ReactNode };

// Key/value grid used across all detail pages.
export function InfoGrid({ items, cols = 3 }: { items: InfoItem[]; cols?: 2 | 3 | 4 }) {
  const grid = cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3";
  return (
    <div className={`grid grid-cols-2 gap-4 ${grid}`}>
      {items.map((i, idx) => (
        <div key={idx} className="min-w-0">
          <p className="text-xs text-muted-foreground">{i.label}</p>
          <p className="mt-0.5 truncate text-sm font-medium capitalize">{i.value ?? "—"}</p>
        </div>
      ))}
    </div>
  );
}

// Data-heavy detail page skeleton: header + a couple of info cards.
export function DetailSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-1">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      {Array.from({ length: sections }).map((_, s) => (
        <Card key={s}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
