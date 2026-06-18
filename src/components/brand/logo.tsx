import { cn } from "@/lib/utils";
import Image from "next/image";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl overflow-hidden bg-sidebar-accent shadow-sm border border-border/40",
        className,
      )}
      aria-hidden
    >
      <Image
        src="/images/logo_icon.png"
        alt="Second Home Logo"
        width={36}
        height={36}
        className="size-full object-cover"
        priority
      />
    </span>
  );
}

export function Logo({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-heading text-lg font-semibold tracking-tight">
          Second Home
        </span>
        {showTagline && (
          <span className="text-[11px] text-muted-foreground">
            Your home away from home
          </span>
        )}
      </span>
    </span>
  );
}
