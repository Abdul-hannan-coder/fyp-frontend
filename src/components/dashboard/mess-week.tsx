"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useMessMenu, type MealMenu, type MenuItem } from "@/lib/features/mess";

// Menu items come back as an array of {item} objects, a plain string array, a
// JSON string, or a comma list — normalize all of them to a readable string.
function itemLabel(it: string | MenuItem): string {
  if (typeof it === "string") return it;
  return it?.item ?? "";
}

function formatItems(items?: string | (string | MenuItem)[]): string {
  if (!items) return "—";
  if (Array.isArray(items)) return items.map(itemLabel).filter(Boolean).join(", ") || "—";
  try {
    const parsed = JSON.parse(items);
    if (Array.isArray(parsed)) return parsed.map(itemLabel).filter(Boolean).join(", ") || "—";
  } catch {
    /* not JSON — use as-is */
  }
  return String(items);
}

function dayLabel(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

type DayRow = { date: string; breakfast?: string; lunch?: string; dinner?: string };

function groupByDay(menu: MealMenu[]): DayRow[] {
  const byDate = new Map<string, DayRow>();
  for (const m of menu) {
    const key = (m.menu_date ?? "").slice(0, 10);
    if (!key) continue;
    const row = byDate.get(key) ?? { date: key };
    const meal = (m.meal_type ?? "").toLowerCase();
    if (meal === "breakfast") row.breakfast = formatItems(m.items);
    else if (meal === "lunch") row.lunch = formatItems(m.items);
    else if (meal === "dinner") row.dinner = formatItems(m.items);
    byDate.set(key, row);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);
}

export function MessWeek() {
  const { menu, loading } = useMessMenu();

  if (loading) {
    return <SkeletonTable cols={4} />;
  }

  const rows = groupByDay(menu);
  if (rows.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No menu published yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Day</TableHead>
          <TableHead>Breakfast</TableHead>
          <TableHead>Lunch</TableHead>
          <TableHead>Dinner</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((m) => (
          <TableRow key={m.date}>
            <TableCell className="font-medium">{dayLabel(m.date)}</TableCell>
            <TableCell className="text-muted-foreground">{m.breakfast ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{m.lunch ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{m.dinner ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
