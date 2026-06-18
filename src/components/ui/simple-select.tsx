
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: Array<SelectOption | string>;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function Select({ value, options, onChange, placeholder, className = "", disabled }: SelectProps) {
  const opts: SelectOption[] = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const selected = opts.find((o) => o.value === value);

  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    const reposition = () => place();
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2 rounded-xl bg-muted/40 border border-border pl-3.5 pr-3 py-2 text-xs font-semibold text-foreground outline-none transition-all shadow-sm hover:bg-accent focus:border-primary focus:bg-background disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
      >
        <span className="truncate">{selected?.label ?? placeholder ?? "—"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            // Keep selection working inside a Radix Dialog/Popover:
            // - stopPropagation: the dialog never sees a "pointer-down outside".
            // - preventDefault on mousedown: focus stays in the dialog, so the
            //   dialog's "focus outside" guard doesn't fire either.
            // The option's onClick still runs, so the value is chosen and the
            // modal stays open.
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width, zIndex: 200 }}
            className="rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl p-1.5 max-h-64 overflow-y-auto no-scrollbar"
          >
            {opts.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer mb-0.5 last:mb-0 ${
                    active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
            {opts.length === 0 && (
              <div className="px-3 py-4 text-center text-xs font-bold text-muted-foreground">No options</div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
