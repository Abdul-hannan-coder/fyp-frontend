"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, KeyRound, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/features/auth/api";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<"request" | "reset">("request");
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwChecks = [
    { ok: password.length >= 8, label: "At least 8 characters" },
    { ok: /[A-Z]/.test(password), label: "One uppercase letter" },
    { ok: /\d/.test(password), label: "One number" },
  ];
  const pwValid = pwChecks.every((c) => c.ok);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) return toast.error("Enter a valid email address.");
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      toast.success("If that account exists, we've emailed a reset code.");
      setStep("reset");
    } catch (err) {
      toast.error((err as ApiError).message || "Could not send reset code");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit code from your email.");
    if (!pwValid) return toast.error("Your new password doesn't meet the requirements.");
    setSubmitting(true);
    try {
      await authApi.resetPassword({ email, otp, new_password: password });
      toast.success("Password reset — please sign in.");
      router.push("/login");
    } catch (err) {
      const e = err as ApiError;
      toast.error(e.errors?.[0]?.message || e.message || "Could not reset password");
    } finally {
      setSubmitting(false);
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

        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold">
            {step === "request" ? <KeyRound className="size-7" /> : <MailCheck className="size-7" />}
          </div>
          <h1 className="mt-5 text-center font-heading text-2xl font-semibold tracking-tight">
            {step === "request" ? "Forgot password" : "Reset password"}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-center text-sm text-muted-foreground">
            {step === "request"
              ? "Enter your account email and we'll send you a 6-digit reset code."
              : `Enter the code sent to ${email} and choose a new password.`}
          </p>

          {step === "request" ? (
            <form className="mt-6 space-y-4" onSubmit={requestCode}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Sending…" : "Send reset code"}
              </Button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={resetPassword}>
              <div className="space-y-2">
                <Label htmlFor="otp">Reset code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Create a new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {password.length > 0 && (
                  <ul className="mt-1 grid gap-1 sm:grid-cols-3">
                    {pwChecks.map((c) => (
                      <li key={c.label} className={cn("flex items-center gap-1.5 text-xs", c.ok ? "text-green-600" : "text-muted-foreground")}>
                        <Check className={cn("size-3.5", c.ok ? "opacity-100" : "opacity-30")} />
                        {c.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Resetting…" : "Reset password"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("request")}
                className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Use a different email
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
