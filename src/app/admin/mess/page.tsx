"use client";

import * as React from "react";
import { Pencil, Plus, Trash2, Receipt } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SimpleSelect from "@/components/ui/simple-select";
import { SkeletonGrid, SkeletonTable } from "@/components/ui/skeleton";
import {
  useMessPlans,
  useAdminMess,
  MESS_PLAN_TYPES,
  MESS_PLAN_STATUSES,
  MENU_MEAL_TYPES,
  type MessPlan,
  type MealMenu,
  type MessSubscription,
  type UpdatePlanInput,
  type CreateMenuInput,
  type GenerateBillingInput,
} from "@/lib/features/mess";

const money = (v?: string | number) =>
  v != null && v !== "" ? `₨ ${Number(v).toLocaleString()}/mo` : "—";

const amount = (v?: string | number) =>
  v != null && v !== "" ? `₨ ${Number(v).toLocaleString()}` : "₨ 0";

const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString() : "—");
const fmtMonth = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—";

const studentName = (s?: MessSubscription["student"]) =>
  s?.user?.full_name ?? s?.student_id ?? "—";

const menuItemsText = (items?: MealMenu["items"]) => {
  if (!items) return "—";
  if (typeof items === "string") return items;
  return items.map((i) => i.item).filter(Boolean).join(", ") || "—";
};

export default function AdminMess() {
  const plansHook = useMessPlans(true);
  const admin = useAdminMess();

  return (
    <>
      <PageHeader title="Mess management" description="Plans, daily menu, billing and subscriptions." />

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <PlansTab plansHook={plansHook} />
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <MenuTab admin={admin} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <BillingTab admin={admin} />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionsTab admin={admin} />
        </TabsContent>
      </Tabs>
    </>
  );
}

/* ───────────────────────── Plans ───────────────────────── */

function PlansTab({ plansHook }: { plansHook: ReturnType<typeof useMessPlans> }) {
  const { plans, loading, error, busy, create, update, remove } = plansHook;
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{plans.length} plan(s)</p>
        <PlanDialog busy={busy} onCreate={create} />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <SkeletonGrid count={6} />
      ) : plans.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No mess plans yet — add your first plan.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  {p.plan_type && (
                    <Badge variant="secondary" className="font-normal capitalize">{p.plan_type.replace(/_/g, " ")}</Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2">
                  {money(p.price_per_month)}
                  {p.status && <StatusBadge status={p.status} />}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                <div className="flex gap-2">
                  <EditPlanDialog busy={busy} plan={p} onUpdate={update} />
                  <DeletePlanDialog busy={busy} plan={p} onDelete={remove} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function PlanDialog({
  busy,
  onCreate,
}: {
  busy: boolean;
  onCreate: (b: { name: string; plan_type: string; price_per_month: number; description?: string }) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("full");
  const [price, setPrice] = React.useState("");
  const [desc, setDesc] = React.useState("");

  const submit = async () => {
    const ok = await onCreate({ name, plan_type: type, price_per_month: Number(price), description: desc || undefined });
    if (ok) { setName(""); setPrice(""); setDesc(""); setOpen(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}><Plus className="size-4" /> Add plan</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New mess plan</DialogTitle>
          <DialogDescription>Residents can subscribe to this plan.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="mp-name">Name</Label><Input id="mp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Mess" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Plan type</Label>
              <SimpleSelect value={type} onChange={setType} className="w-full" options={MESS_PLAN_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))} />
            </div>
            <div className="space-y-1.5"><Label htmlFor="mp-price">Price (₨/mo)</Label><Input id="mp-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="7000" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="mp-desc">Description</Label><Textarea id="mp-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="All meals included" /></div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!name.trim() || !price || busy} onClick={submit}>
            Create plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPlanDialog({
  busy,
  plan,
  onUpdate,
}: {
  busy: boolean;
  plan: MessPlan;
  onUpdate: (id: string, b: UpdatePlanInput) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(plan.name);
  const [type, setType] = React.useState(plan.plan_type ?? "full");
  const [price, setPrice] = React.useState(String(plan.price_per_month ?? ""));
  const [status, setStatus] = React.useState(plan.status ?? "active");
  const [desc, setDesc] = React.useState(plan.description ?? "");

  React.useEffect(() => {
    if (open) {
      setName(plan.name);
      setType(plan.plan_type ?? "full");
      setPrice(String(plan.price_per_month ?? ""));
      setStatus(plan.status ?? "active");
      setDesc(plan.description ?? "");
    }
  }, [open, plan]);

  const submit = async () => {
    const ok = await onUpdate(plan.id, {
      name,
      plan_type: type,
      price_per_month: Number(price),
      status,
      description: desc || undefined,
    });
    if (ok) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}><Pencil className="size-3.5" /> Edit</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit mess plan</DialogTitle>
          <DialogDescription>Update plan details and availability.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="ep-name">Name</Label><Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Plan type</Label>
              <SimpleSelect value={type} onChange={setType} className="w-full" options={MESS_PLAN_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))} />
            </div>
            <div className="space-y-1.5"><Label htmlFor="ep-price">Price (₨/mo)</Label><Input id="ep-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <SimpleSelect value={status} onChange={setStatus} className="w-full" options={MESS_PLAN_STATUSES.map((s) => ({ value: s, label: s }))} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="ep-desc">Description</Label><Textarea id="ep-desc" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!name.trim() || !price || busy} onClick={submit}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeletePlanDialog({
  busy,
  plan,
  onDelete,
}: {
  busy: boolean;
  plan: MessPlan;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const submit = async () => { const ok = await onDelete(plan.id); if (ok) setOpen(false); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="text-destructive hover:text-destructive" />}>
        <Trash2 className="size-3.5" /> Delete
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete mess plan</DialogTitle>
          <DialogDescription>Delete &ldquo;{plan.name}&rdquo;? This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button variant="destructive" disabled={busy} onClick={submit}>
            Delete plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Menu ───────────────────────── */

function MenuTab({ admin }: { admin: ReturnType<typeof useAdminMess> }) {
  const { menu, menuLoading, menuError, menuDate, setMenuDate, busy, createMenu } = admin;
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="menu-date">Filter by date</Label>
          <div className="flex items-center gap-2">
            <Input
              id="menu-date"
              type="date"
              className="w-44"
              value={menuDate}
              onChange={(e) => setMenuDate(e.target.value)}
            />
            {menuDate && (
              <Button variant="ghost" size="sm" onClick={() => setMenuDate("")}>Clear</Button>
            )}
          </div>
        </div>
        <MenuDialog busy={busy} onCreate={createMenu} />
      </div>

      {menuError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{menuError}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daily menu</CardTitle>
          <CardDescription>
            {menuDate ? `Meals for ${fmtDate(menuDate)}` : "Scheduled meals by date."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {menuLoading ? (
            <SkeletonTable cols={4} />
          ) : menu.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {menuDate ? "No menu entries for this date." : "No menu entries yet — add one."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Meal</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menu.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(m.menu_date)}</TableCell>
                    <TableCell className="capitalize font-medium">{m.meal_type}</TableCell>
                    <TableCell className="max-w-sm text-muted-foreground">{menuItemsText(m.items)}</TableCell>
                    <TableCell className="text-muted-foreground">{m.notes ?? "—"}</TableCell>
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

function MenuDialog({
  busy,
  onCreate,
}: {
  busy: boolean;
  onCreate: (b: CreateMenuInput) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState("");
  const [meal, setMeal] = React.useState("breakfast");
  const [items, setItems] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const parsedItems = items
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((item) => ({ item }));

  const submit = async () => {
    const ok = await onCreate({ menu_date: date, meal_type: meal, items: parsedItems, notes: notes || undefined });
    if (ok) { setDate(""); setItems(""); setNotes(""); setMeal("breakfast"); setOpen(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}><Plus className="size-4" /> Add menu</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New menu entry</DialogTitle>
          <DialogDescription>Add the meals planned for a given date.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mn-date">Date</Label>
              <Input id="mn-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Meal type</Label>
              <SimpleSelect value={meal} onChange={setMeal} className="w-full" options={MENU_MEAL_TYPES.map((t) => ({ value: t, label: t }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mn-items">Items</Label>
            <Textarea id="mn-items" value={items} onChange={(e) => setItems(e.target.value)} placeholder="Chicken Karahi, Naan, Salad" />
            <p className="text-xs text-muted-foreground">Comma-separated list of dishes.</p>
          </div>
          <div className="space-y-1.5"><Label htmlFor="mn-notes">Notes</Label><Textarea id="mn-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" /></div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!date || parsedItems.length === 0 || busy} onClick={submit}>
            Add entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Billing ───────────────────────── */

function BillingTab({ admin }: { admin: ReturnType<typeof useAdminMess> }) {
  const { report, reportLoading, reportError, reportMonth, setReportMonth, busy, generateBilling } = admin;
  const totals = report?.totals;
  const bills = report?.bills ?? [];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bill-month">Report month</Label>
          <Input
            id="bill-month"
            type="date"
            className="w-44"
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
          />
        </div>
        <GenerateBillingDialog busy={busy} onGenerate={generateBilling} />
      </div>

      {reportError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{reportError}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total due" value={amount(totals?.total_due)} hint="across bills" />
        <StatCard label="Total paid" value={amount(totals?.total_paid)} trend="up" hint="collected" />
        <StatCard label="Outstanding" value={amount(totals?.total_outstanding)} trend="down" hint="unpaid" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing report</CardTitle>
          <CardDescription>{reportMonth ? fmtMonth(reportMonth) : "All months"}</CardDescription>
        </CardHeader>
        <CardContent>
          {reportLoading ? (
            <SkeletonTable cols={5} />
          ) : bills.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No bills for this period — generate bills to begin.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{studentName(b.student ?? b.subscription?.student)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fmtMonth(b.month)}</TableCell>
                    <TableCell className="text-muted-foreground">{amount(b.amount_due)}</TableCell>
                    <TableCell className="text-muted-foreground">{amount(b.amount_paid)}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={b.status} /></TableCell>
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

function GenerateBillingDialog({
  busy,
  onGenerate,
}: {
  busy: boolean;
  onGenerate: (b: GenerateBillingInput) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState("");
  const [due, setDue] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const submit = async () => {
    const ok = await onGenerate({ month: month || undefined, due_date: due || undefined, notes: notes || undefined });
    if (ok) { setMonth(""); setDue(""); setNotes(""); setOpen(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}><Receipt className="size-4" /> Generate bills</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate mess bills</DialogTitle>
          <DialogDescription>Creates bills for all active subscriptions. Leave month blank for the current month.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gb-month">Month</Label>
              <Input id="gb-month" type="date" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gb-due">Due date</Label>
              <Input id="gb-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="gb-notes">Notes</Label><Textarea id="gb-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" /></div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={busy} onClick={submit}>
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Subscriptions ───────────────────────── */

function SubscriptionsTab({ admin }: { admin: ReturnType<typeof useAdminMess> }) {
  const { subscriptions, subsLoading, subsError } = admin;
  const activeCount = subscriptions.filter((s) => s.status === "active").length;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Subscriptions" value={String(subscriptions.length)} hint="total" />
        <StatCard label="Active" value={String(activeCount)} trend="up" hint="currently subscribed" />
        <StatCard label="Ended/Paused" value={String(subscriptions.length - activeCount)} trend="flat" hint="inactive" />
      </div>

      {subsError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{subsError}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All subscriptions</CardTitle>
          <CardDescription>Residents and their mess plans.</CardDescription>
        </CardHeader>
        <CardContent>
          {subsLoading ? (
            <SkeletonTable cols={5} />
          ) : subscriptions.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No subscriptions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{studentName(s.student)}</TableCell>
                    <TableCell className="text-muted-foreground">{s.messPlan?.name ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(s.start_date)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(s.end_date)}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={s.status} /></TableCell>
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

