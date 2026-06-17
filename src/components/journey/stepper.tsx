import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = { label: string; hint?: string };

export function Stepper({
  steps,
  current,
  className,
}: {
  steps: Step[];
  current: number; // index of the active step
  className?: string;
}) {
  return (
    <ol className={cn("flex items-center", className)}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  done && "border-gold bg-gold text-gold-foreground",
                  active && "border-gold bg-gold/15 text-gold",
                  !done && !active && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <div className="hidden sm:block">
                <p
                  className={cn(
                    "text-xs font-medium",
                    active || done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                {step.hint && <p className="text-[11px] text-muted-foreground">{step.hint}</p>}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full transition-colors sm:mx-3",
                  i < current ? "bg-gold" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
