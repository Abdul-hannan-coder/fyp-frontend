"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, subMonths } from "date-fns";
import type { DateRange as RdpRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePreset {
  key: string;
  label: string;
  build: () => DateRange;
}

export function defaultPresets(): DateRangePreset[] {
  const now = () => new Date();
  return [
    { key: "7d", label: "Last 7 days", build: () => ({ start: startOfDay(subDays(now(), 6)), end: endOfDay(now()) }) },
    { key: "14d", label: "Last 14 days", build: () => ({ start: startOfDay(subDays(now(), 13)), end: endOfDay(now()) }) },
    { key: "30d", label: "Last 30 days", build: () => ({ start: startOfDay(subDays(now(), 29)), end: endOfDay(now()) }) },
    { key: "90d", label: "Last 90 days", build: () => ({ start: startOfDay(subDays(now(), 89)), end: endOfDay(now()) }) },
    { key: "12m", label: "Last 12 months", build: () => ({ start: startOfDay(subMonths(now(), 12)), end: endOfDay(now()) }) },
  ];
}

const fmt = (d: Date | null) => (d ? format(d, "d MMM yyyy") : "—");

interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  presets?: DateRangePreset[];
  align?: "start" | "center" | "end";
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  presets = defaultPresets(),
  align = "end",
  className,
  placeholder = "Select a period",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RdpRange | undefined>(
    value?.start ? { from: value.start, to: value.end ?? undefined } : undefined,
  );

  // Sync the draft to the committed value whenever the popover opens.
  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(value?.start ? { from: value.start, to: value.end ?? undefined } : undefined);
    setOpen(next);
  };

  const activePresetKey = useMemo(() => {
    if (!value?.start || !value?.end) return null;
    const s = startOfDay(value.start).getTime();
    const e = endOfDay(value.end).getTime();
    return presets.find((p) => {
      const r = p.build();
      return r.start && r.end && startOfDay(r.start).getTime() === s && endOfDay(r.end).getTime() === e;
    })?.key ?? null;
  }, [value, presets]);

  const pickPreset = (p: DateRangePreset) => {
    onChange(p.build());
    setOpen(false);
  };

  const applyDraft = () => {
    if (draft?.from) {
      onChange({ start: startOfDay(draft.from), end: endOfDay(draft.to ?? draft.from) });
      setOpen(false);
    }
  };

  const label = value?.start && value?.end ? `${fmt(value.start)} – ${fmt(value.end)}` : placeholder;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border bg-muted/40 px-3.5 py-2 text-xs font-semibold outline-none transition-all",
            value?.start
              ? "border-primary/40 bg-primary/[0.06] text-foreground ring-2 ring-primary/15"
              : "border-border text-foreground hover:bg-accent",
            className,
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          <ul className="flex shrink-0 flex-col gap-0.5 border-b border-border p-2 sm:border-b-0 sm:border-r sm:w-44">
            <li className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Period</li>
            {presets.map((p) => {
              const active = activePresetKey === p.key;
              return (
                <li key={p.key}>
                  <button
                    type="button"
                    onClick={() => pickPreset(p)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent",
                    )}
                  >
                    {p.label}
                    {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="p-3">
            <Calendar
              mode="range"
              selected={draft}
              onSelect={setDraft}
              numberOfMonths={1}
              defaultMonth={value?.start ?? new Date()}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-muted/40 px-2.5 py-1.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Start</span>
                <span className="text-xs font-semibold text-foreground">{fmt(draft?.from ?? null)}</span>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 px-2.5 py-1.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">End</span>
                <span className="text-xs font-semibold text-foreground">{fmt(draft?.to ?? null)}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className="text-[11px] font-bold text-muted-foreground transition-colors hover:text-primary"
              >
                Reset
              </button>
              <Button size="sm" onClick={applyDraft} disabled={!draft?.from} className="text-xs font-bold">
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
