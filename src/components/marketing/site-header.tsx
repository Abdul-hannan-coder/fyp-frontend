"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Browse rooms", href: "/rooms" },
  { label: "Amenities", href: "/#amenities" },
  { label: "Safety", href: "/#safety" },
  { label: "Gallery", href: "/#gallery" },
  { label: "FAQs", href: "/#faq" },
];

export function SiteHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink href="/login" variant="ghost">
            Resident login
          </ButtonLink>
          <ButtonLink href="/apply" className="shadow-sm">
            Apply now
          </ButtonLink>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border/60 md:hidden",
          open ? "max-h-96" : "max-h-0",
          "transition-[max-height] duration-300",
        )}
      >
        <div className="space-y-1 px-4 py-3">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-2 pt-2">
            <ButtonLink href="/login" variant="outline" className="flex-1">
              Resident login
            </ButtonLink>
            <ButtonLink href="/apply" className="flex-1">
              Apply now
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
