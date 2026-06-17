"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  /** Date as a `YYYY-MM-DD` string. */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Latest selectable day (defaults to today — useful for dates of birth). */
  toDate?: Date;
}

// Parse `YYYY-MM-DD` as a *local* date so the calendar doesn't shift a day in
// timezones behind UTC.
function parseLocal(value?: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  disabled,
  className,
  toDate = new Date(),
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseLocal(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn("truncate", selected ? "text-foreground" : "text-muted-foreground")}>
            {selected ? format(selected, "dd MMM yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[120] w-auto bg-popover p-3 text-popover-foreground">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? new Date(2000, 0)}
          captionLayout="dropdown"
          startMonth={new Date(1950, 0)}
          endMonth={toDate}
          disabled={{ after: toDate }}
          onSelect={(d) => {
            if (d) {
              onChange(toYmd(d));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
