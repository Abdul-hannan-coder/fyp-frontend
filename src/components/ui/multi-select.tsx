"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  contentClassName?: string;
  listClassName?: string;
  align?: "start" | "center" | "end";
  clearable?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  className,
  contentClassName,
  listClassName,
  align = "start",
  clearable = true,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const count = selected.length;
  const summary =
    count === 0
      ? placeholder
      : count === 1
        ? options.find((o) => o.value === selected[0])?.label ?? `${count} selected`
        : `${count} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold outline-none transition-all",
            count > 0
              ? "border-primary/40 bg-primary/[0.06] text-foreground ring-2 ring-primary/15"
              : "border-border text-foreground hover:bg-accent",
            className,
          )}
        >
          <span className={cn("truncate", count === 0 && "text-muted-foreground")}>{summary}</span>
          {count > 0 ? (
            <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          ) : (
            <ChevronDown size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className={cn("z-[120] p-0", contentClassName ?? "w-56")}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className={listClassName}>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                    className="cursor-pointer gap-2"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input",
                      )}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          {clearable && count > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex w-full items-center justify-center gap-1.5 border-t border-border px-3 py-2 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
