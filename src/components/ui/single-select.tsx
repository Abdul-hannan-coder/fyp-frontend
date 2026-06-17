"use client";

import { MultiSelect, type MultiSelectOption } from "./multi-select";

export type SingleSelectOption = MultiSelectOption;

interface SingleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  align?: "start" | "center" | "end";
  fullWidth?: boolean;
}

export function SingleSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  align,
  fullWidth,
}: SingleSelectProps) {
  return (
    <MultiSelect
      options={options}
      selected={value ? [value] : []}
      onChange={(vals) => onChange(vals.length ? vals[vals.length - 1] : "")}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyText={emptyText}
      className={className}
      contentClassName={`${fullWidth ? "w-[var(--radix-popover-trigger-width)]" : "w-56"} z-[120]`}
      align={align}
      clearable={false}
    />
  );
}
