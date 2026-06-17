"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stepper } from "@/components/journey/stepper";
import { useAuth, roleHome } from "@/lib/features/auth/useAuth";

const journeySteps = [
  { label: "Apply" },
  { label: "Approval" },
  { label: "Verify" },
  { label: "Pay" },
  { label: "Move in" },
];

export default function VerifyPage() {
  const router = useRouter();
  const { verifyEmail, resendOtp } = useAuth();
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = React.useState(false);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const autoSent = React.useRef(false);

  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("email");
    if (q) {
      setEmail(q);
      // No OTP is sent at signup/login — request one automatically on arrival.
      if (!autoSent.current) {
        autoSent.current = true;
        resendOtp(q)
          .then(() => toast.success("We've emailed you a 6-digit code"))
          .catch(() => {
            /* cooldown or already-sent — user can use Resend */
          });
      }
    }
  }, [resendOtp]);

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const code = otp.join("");
  const complete = code.length === 6;

  const verify = async () => {
    if (!email) return toast.error("Enter the email you applied with");
    if (!complete) return toast.error("Enter the 6-digit code");
    setSubmitting(true);
    try {
      const user = await verifyEmail({ email, otp: code });
      toast.success("Email verified — welcome!");
      router.push(roleHome(user.role?.name));
    } catch (err) {
      toast.error((err as Error).message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (!email) return toast.error("Enter your email first");
    try {
      await resendOtp(email);
      toast.success("A new code is on its way");
    } catch (err) {
      toast.error((err as Error).message || "Could not resend code");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold">
            <MailCheck className="size-7" />
          </div>
          <h1 className="mt-5 font-heading text-2xl font-semibold tracking-tight">
            Verify your email
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            We sent a 6-digit code to your email. Enter it below to confirm your
            address.
          </p>

          <div className="mt-6 space-y-2 text-left">
            <Label htmlFor="verify-email">Email</Label>
            <Input
              id="verify-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mt-5 flex justify-center gap-2 sm:gap-3">
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                inputMode="numeric"
                maxLength={1}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                className="size-12 rounded-xl border border-border bg-background text-center font-heading text-xl font-semibold outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/30 sm:size-14"
              />
            ))}
          </div>

          <Button onClick={verify} className="mt-7 w-full" size="lg" disabled={submitting}>
            {submitting ? "Verifying…" : "Verify & continue"}
          </Button>

          <p className="mt-4 text-sm text-muted-foreground">
            Didn&apos;t get it?{" "}
            <Button variant="link" className="h-auto px-0 text-gold" onClick={resend}>
              Resend code
            </Button>
          </p>
        </div>

        <div className="mt-8">
          <Stepper steps={journeySteps} current={2} />
        </div>
      </div>
    </div>
  );
}
