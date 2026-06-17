import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  // positive
  active: "bg-success/12 text-success border-success/25",
  paid: "bg-success/12 text-success border-success/25",
  approved: "bg-success/12 text-success border-success/25",
  present: "bg-success/12 text-success border-success/25",
  resolved: "bg-success/12 text-success border-success/25",
  checked_in: "bg-success/12 text-success border-success/25",
  on_duty: "bg-success/12 text-success border-success/25",
  in_use: "bg-success/12 text-success border-success/25",
  good: "bg-success/12 text-success border-success/25",
  // warning
  pending: "bg-warning/15 text-gold-foreground border-warning/30",
  partial: "bg-warning/15 text-gold-foreground border-warning/30",
  in_progress: "bg-warning/15 text-gold-foreground border-warning/30",
  leave: "bg-warning/15 text-gold-foreground border-warning/30",
  on_leave: "bg-warning/15 text-gold-foreground border-warning/30",
  maintenance: "bg-warning/15 text-gold-foreground border-warning/30",
  fair: "bg-warning/15 text-gold-foreground border-warning/30",
  // danger
  overdue: "bg-destructive/12 text-destructive border-destructive/25",
  unpaid: "bg-destructive/12 text-destructive border-destructive/25",
  blocked: "bg-destructive/12 text-destructive border-destructive/25",
  rejected: "bg-destructive/12 text-destructive border-destructive/25",
  absent: "bg-destructive/12 text-destructive border-destructive/25",
  open: "bg-destructive/12 text-destructive border-destructive/25",
  poor: "bg-destructive/12 text-destructive border-destructive/25",
  // neutral
  off: "bg-muted text-muted-foreground border-border",
  checked_out: "bg-muted text-muted-foreground border-border",
};

const LABELS: Record<string, string> = {
  in_progress: "In progress",
  checked_in: "Checked in",
  checked_out: "Checked out",
  on_duty: "On duty",
  on_leave: "On leave",
  in_use: "In use",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const label = LABELS[key] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge
      variant="outline"
      className={cn("font-medium capitalize", MAP[key] ?? "bg-muted text-muted-foreground")}
    >
      {label}
    </Badge>
  );
}
