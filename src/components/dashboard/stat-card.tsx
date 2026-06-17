import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  trend = "flat",
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: string;
  hint?: string;
  icon?: LucideIcon;
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  return (
    <Card className="group/stat gap-0 p-5 transition-all duration-200 hover:ring-foreground/15 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover/stat:bg-primary/10 group-hover/stat:text-primary">
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
        ) : delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trend === "up" && "bg-success/12 text-success",
              trend === "down" && "bg-destructive/10 text-destructive",
              trend === "flat" && "bg-muted text-muted-foreground",
            )}
          >
            <TrendIcon className="size-3" />
            {delta}
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-heading text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {(hint || (Icon && delta)) && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          {Icon && delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                trend === "up" && "text-success",
                trend === "down" && "text-destructive",
              )}
            >
              <TrendIcon className="size-3" />
              {delta}
            </span>
          )}
          {hint}
        </p>
      )}
    </Card>
  );
}
