"use client";

import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatItem {
  value: React.ReactNode;
  label: string;
  subtext?: React.ReactNode;
  icon?: LucideIcon;
  highlight?: boolean;
  danger?: boolean;
  onClick?: () => void;
  loading?: boolean;
}

export function Stats({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <div
      role="list"
      aria-label="Key metrics"
      className={cn("grid w-full items-stretch gap-3 sm:gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]", className)}
    >
      {items.map((s, i) => {
        const Icon = s.icon;
        const clickable = Boolean(s.onClick) && !s.loading;
        const valueColor = s.highlight ? "text-primary-foreground" : s.danger ? "text-destructive" : "text-foreground";
        return (
          <div
            key={i}
            role="listitem"
            onClick={clickable ? s.onClick : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); s.onClick?.(); } } : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-label={clickable ? s.label : undefined}
            className={cn(
              "flex h-full flex-col gap-3 rounded-2xl border p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-200",
              s.highlight
                ? "border-transparent bg-primary shadow-[0_12px_30px_-8px_var(--primary)]"
                : s.danger
                  ? "border-destructive/25 bg-card"
                  : "border-border bg-card",
              clickable && "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgb(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <div className="flex min-h-[2.25rem] items-start justify-between gap-2">
              <span className={cn("line-clamp-2 text-sm font-semibold leading-tight", s.highlight ? "text-primary-foreground/90" : "text-foreground")}>
                {s.label}
              </span>
              {Icon && (
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    s.highlight ? "bg-primary-foreground/20 text-primary-foreground" : s.danger ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
              )}
            </div>

            <div className={cn("text-[2.1rem] font-bold leading-none tabular-nums", valueColor)}>
              {s.loading ? (
                <span className="inline-block h-7 w-12 animate-pulse rounded-md bg-muted align-middle" />
              ) : (
                s.value
              )}
            </div>

            {s.subtext && (
              <div
                className={cn(
                  "mt-auto truncate text-[11px] font-medium",
                  s.highlight ? "text-primary-foreground/80" : s.danger ? "text-destructive" : "text-muted-foreground",
                )}
                title={typeof s.subtext === "string" ? s.subtext : undefined}
              >
                {s.subtext}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
