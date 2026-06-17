import Link from "next/link";
import { ArrowLeft, Quote } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";

export function AuthShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 10%, rgba(201,151,74,0.18) 0%, transparent 55%), radial-gradient(50% 50% at 90% 90%, rgba(201,151,74,0.10) 0%, transparent 55%)",
          }}
        />
        <Link href="/" className="relative">
          <span className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-heading text-lg font-semibold tracking-tight">
              Second Home
            </span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <Quote className="size-8 text-sidebar-primary" />
          <p className="mt-4 font-heading text-2xl font-medium leading-snug">
            Moving in felt effortless. Fees, mess, my room — everything in one
            place, finally.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-sidebar-accent font-semibold text-sidebar-primary">
              HI
            </span>
            <div>
              <p className="text-sm font-medium">Hamza Iqbal</p>
              <p className="text-xs text-sidebar-foreground/60">
                Resident · Block A
              </p>
            </div>
          </div>
        </div>

        <p className="relative text-sm text-sidebar-foreground/50">
          Your home away from home.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
