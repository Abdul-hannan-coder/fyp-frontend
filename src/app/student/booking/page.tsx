"use client";

import * as React from "react";
import {
  BedDouble,
  Building2,
  Check,
  Clock,
  CreditCard,
  Landmark,
  ShieldCheck,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Stepper } from "@/components/journey/stepper";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/features/auth/useAuth";
import { useMyAllocation } from "@/lib/features/allocation/useAllocation";
import { useMyPayments } from "@/lib/features/fees/useFees";
import { usePublicRoom } from "@/lib/features/public";

const journeySteps = [
  { label: "Apply" },
  { label: "Approval" },
  { label: "Verify" },
  { label: "Pay" },
  { label: "Move in" },
];

const methods = [
  { icon: Landmark, label: "Bank transfer", hint: "Upload proof" },
  { icon: CreditCard, label: "Card / Online", hint: "Pay instantly" },
  { icon: Wallet, label: "Cash at office", hint: "Pay on campus" },
];
const money = (v: number | string) => `₨ ${Number(v).toLocaleString()}`;
const sharing = (cap: number) => (cap <= 1 ? "Private room" : `Sharing for ${cap}`);

export default function StudentBooking() {
  const { user } = useAuth();
  const { allocation, loading: aLoading } = useMyAllocation();
  // Students confirm payment by uploading proof; an admin then verifies it.
  const { payments, loading: pLoading, submitting, uploadProof } = useMyPayments();
  // Before allocation we still want to show the room the resident picked at signup.
  const { room: pickedRoom } = usePublicRoom(!allocation && user?.selected_room_id ? user.selected_room_id : null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const dues = payments.filter((p) => p.status !== "paid" && p.status !== "waived");
  const total = dues.reduce((s, p) => s + (Number(p.total_amount) - Number(p.amount_paid)), 0);
  const busy = aLoading || pLoading;

  // `/allocations/my` only returns ACTIVE allocations, so while a booking is in
  // `pending_payment` we detect the reservation from outstanding dues instead.
  const hasDues = dues.length > 0;
  const confirmed = allocation?.status === "active";
  // Truly nothing yet (no reserved payment, no active room) → still under review.
  const awaitingApproval = !hasDues && !allocation && !busy;

  const roomNo = allocation?.room?.room_number ?? pickedRoom?.room_number ?? "—";
  const roomType = allocation?.room?.roomType?.name ?? pickedRoom?.roomType?.name ?? "Your room";
  const cap = allocation?.room?.capacity ?? pickedRoom?.capacity;
  const blockName = allocation?.room?.block?.name ?? pickedRoom?.block?.name;

  // Journey position: confirmed → Move in, dues outstanding → Pay, else Approval.
  const current = confirmed ? 4 : hasDues ? 3 : 1;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && dues[0]) await uploadProof(dues[0].id, file);
  };

  return (
    <>
      <PageHeader
        title="Complete your booking"
        description={
          awaitingApproval
            ? "Your application is under review — here's the room you selected."
            : "Your room is reserved — confirm it by completing payment."
        }
      />

      <Card className="border-gold/30 bg-gold/5">
        <CardContent className="py-5">
          <Stepper steps={journeySteps} current={current} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{awaitingApproval ? "Selected room" : "Reserved room"}</CardTitle>
              <CardDescription>
                {awaitingApproval ? "Confirmed once an admin approves your application" : "Held for you until payment is confirmed"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <BedDouble className="size-6" />
                </div>
                <div className="flex-1">
                  <p className="font-heading text-lg font-semibold">
                    {roomNo === "—" ? roomType : `Room ${roomNo}`}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                    {blockName && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="size-3.5" /> {blockName}
                      </span>
                    )}
                    {cap != null && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" /> {sharing(cap)}
                      </span>
                    )}
                    {allocation ? ` · ${allocation.academic_year}` : ""}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning">
                  <Clock className="size-3.5" />
                  {confirmed ? "Active" : awaitingApproval ? "Pending approval" : "Reserved"}
                </span>
              </div>

              {/* Amenities of the selected room (pre-allocation) */}
              {!allocation && pickedRoom?.amenities && pickedRoom.amenities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pickedRoom.amenities.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1 rounded-md bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold">
                      <Check className="size-3" /> {a.name}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {awaitingApproval ? (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">What happens next</CardTitle>
                <CardDescription>You&apos;ll be able to pay as soon as your application is approved.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">1.</span> An admin reviews and approves your application.</p>
                <p><span className="font-medium text-foreground">2.</span> Your room is reserved and a payment is raised.</p>
                <p><span className="font-medium text-foreground">3.</span> You pay here and upload proof to confirm.</p>
                <ButtonLink href="/student" variant="outline" className="mt-2">Back to dashboard</ButtonLink>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment method</CardTitle>
                <CardDescription>Choose how you&apos;d like to pay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {methods.map((m, i) => (
                    <button key={m.label} className={`rounded-xl border p-4 text-left transition-all hover:border-gold/50 ${i === 0 ? "border-gold bg-gold/10 ring-1 ring-gold/30" : "border-border"}`}>
                      <m.icon className="size-5 text-gold" />
                      <p className="mt-3 text-sm font-semibold">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.hint}</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-dashed border-border p-4">
                  <p className="text-sm font-medium">Bank details</p>
                  <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>Bank: <span className="text-foreground">Meezan Bank</span></p>
                    <p>Title: <span className="text-foreground">Second Home Hostel</span></p>
                    <p>Account: <span className="text-foreground">0123-4567890123</span></p>
                    <p>IBAN: <span className="text-foreground">PK00 MEZN 0001 2345 6789</span></p>
                  </div>
                </div>

                <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={onFile} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={dues.length === 0 || submitting}
                  className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-gold/50 disabled:opacity-50"
                >
                  <Upload className="size-6 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload payment proof</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG or PDF up to 5 MB</p>
                </button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment summary</CardTitle>
            </CardHeader>
            <CardContent>
              {busy ? (
                <div className="space-y-3 py-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-px w-full" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-7 w-28" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : awaitingApproval ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No payment due yet. It&apos;ll appear here once your application is approved.
                </p>
              ) : dues.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No outstanding dues. You&apos;re all set!
                </p>
              ) : (
                <>
                  <div className="space-y-3">
                    {dues.map((d) => (
                      <div key={d.id} className="flex items-start justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{d.feeStructure?.name ?? "Room fee"}</span>
                        <span className="font-medium">{money(Number(d.total_amount) - Number(d.amount_paid))}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total due</span>
                    <span className="font-heading text-2xl font-semibold">{money(total)}</span>
                  </div>
                  <Button size="lg" className="mt-5 w-full" onClick={() => fileRef.current?.click()} disabled={submitting}>
                    {submitting ? "Uploading…" : "Pay & upload proof"}
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Transfer to the account shown, then upload your receipt.
                  </p>
                </>
              )}
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-success" /> Secure · verified by admin
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
