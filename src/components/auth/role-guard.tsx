"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, roleHome } from "@/lib/features/auth/useAuth";
import type { RoleName } from "@/lib/features/auth/types";

/**
 * Client-side route guard for dashboard areas. Each dashboard layout declares
 * which roles may enter; anyone unauthenticated is sent to /login and any
 * authenticated user in the wrong area is bounced to their own home.
 *
 * The backend remains the source of truth (it rejects unauthorized API calls);
 * this only keeps the UI honest and avoids flashing the wrong dashboard.
 */
export function RoleGuard({
  allow,
  children,
}: {
  allow: RoleName[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status, role } = useAuth();

  const allowed = !!role && allow.includes(role);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && !allowed) {
      router.replace(roleHome(role));
    }
  }, [status, allowed, role, router]);

  // While bootstrapping the session, or mid-redirect, show a calm loader.
  if (status === "idle" || status === "loading" || status === "unauthenticated" || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
