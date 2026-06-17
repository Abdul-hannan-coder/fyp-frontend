"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurtainButton } from "@/components/ui/curtain-button";
import { AnimatedCharacters } from "@/components/ui/animated-characters-login-page";
import { useAuth, roleHome } from "@/lib/features/auth/useAuth";
import { ApiError } from "@/lib/http";

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyLoginOtp } = useAuth();
  const [step, setStep] = React.useState<"credentials" | "otp">("credentials");
  const [show, setShow] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Step 1 — credentials → request an emailed code.
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await login({ email, password });
      setOtp("");
      setStep("otp");
      if (res.dev_otp) toast.info(`Dev code: ${res.dev_otp}`, { duration: 10000 });
      else toast.success("We've emailed you a 6-digit verification code.");
    } catch (err) {
      if (err instanceof ApiError && err.code === "PENDING_APPROVAL") {
        toast.info("Your application is awaiting admin approval. We'll email you once it's approved.");
        return;
      }
      toast.error((err as Error).message || "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 — verify the code → establish the session.
  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit code.");
    setSubmitting(true);
    try {
      const user = await verifyLoginOtp({ email, otp });
      toast.success(`Welcome back, ${user.full_name.split(" ")[0]}`);
      router.push(roleHome(user.role?.name));
    } catch (err) {
      toast.error((err as Error).message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    try {
      const res = await login({ email, password });
      if (res.dev_otp) toast.info(`Dev code: ${res.dev_otp}`, { duration: 10000 });
      else toast.success("A new code is on its way.");
    } catch (err) {
      toast.error((err as Error).message || "Could not resend the code");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Decorative animated panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/10 backdrop-blur-sm">
            <Sparkles className="size-4" />
          </div>
          <span>Second Home</span>
        </div>

        <AnimatedCharacters isTyping={typing} password={password} showPassword={show} />

        <div>
          <p className="font-heading text-2xl font-semibold tracking-tight">Your home away from home.</p>
          <p className="mt-1 text-sm text-primary-foreground/70">Sign in to manage your stay at Second Home.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {step === "credentials" ? (
            <>
              <div className="space-y-2">
                <h1 className="font-heading text-2xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground">Sign in to your Second Home account.</p>
              </div>

              <form className="mt-7 space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setTyping(true)}
                    onBlur={() => setTyping(false)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={show ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setTyping(true)}
                      onBlur={() => setTyping(false)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label="Toggle password"
                    >
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <CurtainButton
                  type="submit"
                  text={submitting ? "Sending code…" : "Continue"}
                  isLoading={submitting}
                  size="lg"
                  className="w-full"
                />
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link href="/apply" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Apply for a room
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold">
                <ShieldCheck className="size-6" />
              </div>
              <div className="mt-4 space-y-2 text-center">
                <h1 className="font-heading text-2xl font-semibold tracking-tight">Verify it&apos;s you</h1>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. Enter it to finish signing in.
                </p>
              </div>

              <form className="mt-7 space-y-4" onSubmit={onVerify}>
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoFocus
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center font-heading text-lg tracking-[0.5em]"
                  />
                </div>

                <CurtainButton
                  type="submit"
                  text={submitting ? "Verifying…" : "Verify & sign in"}
                  isLoading={submitting}
                  size="lg"
                  className="w-full"
                />
              </form>

              <div className="mt-5 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep("credentials"); setOtp(""); }}
                  className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  <ArrowLeft className="size-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={resend}
                  className="font-medium text-gold underline-offset-4 hover:underline"
                >
                  Resend code
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
