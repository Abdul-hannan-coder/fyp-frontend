"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BedDouble, Building2, Check, Clock, Loader2, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Stepper } from "@/components/journey/stepper";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SimpleSelect from "@/components/ui/simple-select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/features/auth/useAuth";
import { usePublicRoom } from "@/lib/features/public";
import { ApiError } from "@/lib/http";
import { toast } from "sonner";

const money = (v: string | number) => `₨ ${Number(v).toLocaleString()}`;
const sharing = (cap: number) => (cap <= 1 ? "Private room" : `Sharing for ${cap}`);

const journeySteps = [
  { label: "Apply" },
  { label: "Approval" },
  { label: "Verify" },
  { label: "Pay" },
  { label: "Move in" },
];

export default function ApplyPage() {
  return (
    <React.Suspense
      fallback={
        <Shell>
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        </Shell>
      }
    >
      <ApplyInner />
    </React.Suspense>
  );
}

function ApplyInner() {
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");
  const { room, loading: roomLoading } = usePublicRoom(roomId);

  // Account
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  // Resident profile (required so admin approval can reserve the room)
  const [dob, setDob] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [guardianName, setGuardianName] = React.useState("");
  const [guardianPhone, setGuardianPhone] = React.useState("");
  const [guardianRelation, setGuardianRelation] = React.useState("");
  const [city, setCity] = React.useState("");
  const [department, setDepartment] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const pwChecks = [
    { ok: password.length >= 8, label: "At least 8 characters" },
    { ok: /[A-Z]/.test(password), label: "One uppercase letter" },
    { ok: /\d/.test(password), label: "One number" },
  ];
  const passwordValid = pwChecks.every((c) => c.ok);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneValid = phone.trim() === "" || /^[+]?[()0-9\s.-]{7,}$/.test(phone);
  const profileValid =
    dob !== "" && gender !== "" && guardianName.trim().length >= 2 && guardianPhone.trim().length >= 5;
  const canSubmit =
    fullName.trim().length >= 2 && emailValid && phoneValid && passwordValid && profileValid && !submitting;

  const validate = () => {
    if (fullName.trim().length < 2) return "Please enter your full name.";
    if (!emailValid) return "Please enter a valid email address.";
    if (!phoneValid) return "Please enter a valid phone number.";
    if (!passwordValid) return "Your password doesn't meet the requirements.";
    if (!dob) return "Please enter your date of birth.";
    if (!gender) return "Please select your gender.";
    if (guardianName.trim().length < 2) return "Please enter your guardian's name.";
    if (guardianPhone.trim().length < 5) return "Please enter your guardian's phone number.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      await register({
        email,
        password,
        full_name: fullName,
        phone,
        role_name: "student",
        ...(roomId ? { selected_room_id: roomId } : {}),
        student: {
          date_of_birth: dob,
          gender: gender as "male" | "female" | "other",
          guardian_name: guardianName,
          guardian_phone: guardianPhone,
          guardian_relation: guardianRelation || undefined,
          city: city || undefined,
          department: department || undefined,
        },
      });
      toast.success("Application submitted!");
      setSubmitted(true);
    } catch (err) {
      const e = err as ApiError;
      const detail = e.errors?.[0]?.message;
      toast.error(detail || e.message || "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Clock className="size-7" />
          </div>
          <h1 className="mt-5 font-heading text-2xl font-semibold tracking-tight">
            Application received
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Thanks, {fullName.split(" ")[0]}! Your application{room ? ` for Room ${room.room_number}` : ""} is
            now <span className="font-medium text-foreground">pending admin approval</span>. Once approved
            you can sign in to verify your email, see your reserved room and pay.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/login">Go to sign in</ButtonLink>
            <ButtonLink href="/" variant="outline">
              Back to home
            </ButtonLink>
          </div>
          <div className="mt-8">
            <Stepper steps={journeySteps} current={0} />
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6">
        <Stepper steps={journeySteps} current={0} />
      </div>

      {/* Selected room summary */}
      {roomId && (
        <div className="mb-5 rounded-2xl border border-gold/40 bg-gold/5 p-5 shadow-sm">
          {roomLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading your selected room…
            </div>
          ) : room ? (
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BedDouble className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gold">Your selection</p>
                <p className="truncate font-heading text-lg font-semibold">
                  Room {room.room_number} · {money(room.total_price)}/mo
                </p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="size-3.5" /> {room.block?.name ?? "Hostel"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" /> {sharing(room.capacity ?? 1)}
                  </span>
                </p>
              </div>
              <Link href="/rooms" className="shrink-0 text-xs font-medium text-gold underline-offset-4 hover:underline">
                Change
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              That room couldn&apos;t be found. <Link href="/rooms" className="text-gold underline">Browse rooms</Link>.
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={submit}
        className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8"
      >
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {roomId ? "Complete your application" : "Apply for a room"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {roomId
            ? "Create your account and tell us a bit about yourself. An admin reviews and approves it, then you pay to confirm."
            : "Create your account to start your application. Pick a specific room any time from "}
          {!roomId && <Link href="/rooms" className="text-gold underline">Browse rooms</Link>}
          {!roomId && "."}
        </p>

        {/* Account details */}
        <SectionTitle>Account</SectionTitle>
        <div className="space-y-5">
          <Field id="full_name" label="Full name" placeholder="Hamza Iqbal" value={fullName} onChange={setFullName} autoComplete="name" required />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} autoComplete="email" required />
            <Field id="phone" label="Phone" placeholder="+92 300 0000000" value={phone} onChange={setPhone} autoComplete="tel" />
          </div>
          <div>
            <Field id="password" label="Password" type="password" placeholder="Create a strong password" value={password} onChange={setPassword} autoComplete="new-password" required />
            {password.length > 0 && (
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-3">
                {pwChecks.map((c) => (
                  <li key={c.label} className={cn("flex items-center gap-1.5 text-xs", c.ok ? "text-green-600" : "text-muted-foreground")}>
                    <Check className={cn("size-3.5", c.ok ? "opacity-100" : "opacity-30")} />
                    {c.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Resident details */}
        <SectionTitle>Resident details</SectionTitle>
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="dob" label="Date of birth" type="date" value={dob} onChange={setDob} required />
            <div className="space-y-2">
              <Label>Gender<span className="ml-0.5 text-gold">*</span></Label>
              <SimpleSelect
                className="w-full"
                value={gender}
                onChange={setGender}
                placeholder="Select…"
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="city" label="City" placeholder="Lahore" value={city} onChange={setCity} />
            <Field id="department" label="Department / Course" placeholder="Computer Science" value={department} onChange={setDepartment} />
          </div>
        </div>

        {/* Guardian */}
        <SectionTitle>Guardian / emergency contact</SectionTitle>
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="guardian_name" label="Guardian name" placeholder="Parent / guardian" value={guardianName} onChange={setGuardianName} required />
            <Field id="guardian_phone" label="Guardian phone" placeholder="+92 300 0000000" value={guardianPhone} onChange={setGuardianPhone} required />
          </div>
          <Field id="guardian_relation" label="Relationship" placeholder="Father, Mother, Sibling…" value={guardianRelation} onChange={setGuardianRelation} />
        </div>

        <p className="mt-6 px-1 text-xs text-muted-foreground">
          By submitting you agree to our Terms and Privacy Policy. An admin will review your application; you can
          sign in to verify your email and pay once it&apos;s approved.
        </p>

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={!canSubmit}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Submitting…" : "Submit application"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </Shell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 mt-8 border-b border-border/60 pb-2 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-0.5 text-gold">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </div>
  );
}
