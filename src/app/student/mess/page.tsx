"use client";

import * as React from "react";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { MessWeek } from "@/components/dashboard/mess-week";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMyMess, type MessPlan } from "@/lib/features/mess";

const money = (v?: string | number) => `₨ ${Number(v ?? 0).toLocaleString()}`;

export default function StudentMess() {
  const { plan, plans, bills, loading, busy, choosePlan, payBill } = useMyMess();
  const [open, setOpen] = React.useState(false);

  const activePlan = plan?.messPlan;

  return (
    <>
      <PageHeader title="Mess" description="Your plan, weekly menu and billing.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" />}>
            {plan ? "Change plan" : "Subscribe"}
          </DialogTrigger>
          <ChoosePlanDialog
            plans={plans}
            currentId={plan?.mess_plan_id}
            busy={busy}
            onChoose={async (id) => {
              const ok = await choosePlan(id);
              if (ok) setOpen(false);
            }}
          />
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="size-4 text-primary" /> Your plan
            </CardTitle>
            <CardDescription>Active subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </div>
            ) : !plan ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                You&apos;re not subscribed to a mess plan yet.
              </p>
            ) : (
              <>
                <div className="rounded-xl bg-primary/5 p-4">
                  <p className="font-heading text-xl font-semibold">{activePlan?.name ?? "Mess plan"}</p>
                  {activePlan?.description && (
                    <p className="text-sm text-muted-foreground">{activePlan.description}</p>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly</span>
                  <span className="font-medium">{money(activePlan?.price_per_month)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={plan.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Since</span>
                  <span className="font-medium">{String(plan.start_date).slice(0, 10)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>This week&apos;s menu</CardTitle>
            <CardDescription>What&apos;s cooking at Second Home</CardDescription>
          </CardHeader>
          <CardContent>
            <MessWeek />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Your mess bills</CardDescription>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No bills yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{String(b.month).slice(0, 7)}</TableCell>
                    <TableCell>{money(b.amount_due)}</TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-right">
                      {b.status === "paid" ? (
                        <span className="text-xs text-muted-foreground">Paid</span>
                      ) : (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => payBill(b.id)}>
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ChoosePlanDialog({
  plans,
  currentId,
  busy,
  onChoose,
}: {
  plans: MessPlan[];
  currentId?: string;
  busy: boolean;
  onChoose: (id: string) => void;
}) {
  const [selected, setSelected] = React.useState(currentId ?? "");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Choose a mess plan</DialogTitle>
        <DialogDescription>Pick the plan that fits you. You can change it later.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        {plans.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No plans available.</p>
        ) : (
          plans.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                  active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"
                }`}
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                </div>
                <span className="text-sm font-semibold">{money(p.price_per_month)}</span>
              </button>
            );
          })
        )}
      </div>
      <DialogFooter showCloseButton>
        <Button disabled={!selected || selected === currentId || busy} onClick={() => onChoose(selected)}>
          {busy && <Loader2 className="size-4 animate-spin" />} Confirm
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
