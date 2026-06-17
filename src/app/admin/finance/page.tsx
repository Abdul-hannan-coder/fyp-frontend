"use client";

import * as React from "react";
import { Check, Eye, FileText, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { feesApi } from "@/lib/features/fees/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { DonutChart } from "@/components/ui/donut-chart";
import SimpleSelect from "@/components/ui/simple-select";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { SkeletonCards, SkeletonTable } from "@/components/ui/skeleton";
import { usePayments, useFeeStructures } from "@/lib/features/fees/useFees";
import type { Payment } from "@/lib/features/fees/types";
import { useFeeDashboard } from "@/lib/features/reports";
import { useAsync } from "@/lib/useAsync";
import { roomsApi } from "@/lib/features/rooms";

const money = (v: string | number) => `₨ ${Number(v).toLocaleString()}`;
const nameOf = (p: { student?: { user?: { full_name: string }; student_id?: string } }) =>
  p.student?.user?.full_name ?? p.student?.student_id ?? "Resident";
const FEE_TYPES = ["hostel_rent", "security_deposit", "mess_fee", "maintenance", "late_fee", "other"];

export default function AdminFinance() {
  const { payments, loading, error, verify, busyId } = usePayments();
  const { fees } = useFeeDashboard();
  const fs = useFeeStructures();
  const [rejecting, setRejecting] = React.useState<Payment | null>(null);
  const [verifying, setVerifying] = React.useState<Payment | null>(null);
  const [dueRange, setDueRange] = React.useState<DateRange | null>(null);

  const collectionDonut = [
    { name: "Collected", value: Math.round(fees?.total_collected ?? 0), fill: "var(--chart-1)" },
    { name: "Pending", value: Math.round(fees?.total_pending ?? 0), fill: "var(--chart-2)" },
    { name: "Overdue", value: Math.round(fees?.total_overdue ?? 0), fill: "var(--chart-3)" },
  ].filter((d) => d.value > 0);

  // Optional due-date window for the full payments ledger.
  const inDueRange = (p: Payment) => {
    if (!dueRange?.start || !dueRange?.end || !p.due_date) return true;
    const d = new Date(p.due_date).getTime();
    return d >= dueRange.start.getTime() && d <= dueRange.end.getTime();
  };
  const visiblePayments = payments.filter(inDueRange);

  const pending = payments.filter((p) => p.status === "pending" || p.status === "partial");
  const collected = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.total_amount), 0);
  const outstanding = pending.reduce((s, p) => s + (Number(p.total_amount) - Number(p.amount_paid)), 0);

  return (
    <>
      <PageHeader title="Finance" description="Fees, payments, verification and refunds.">
        <FeeStructureDialog busy={fs.busy} onCreate={fs.create} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Collected" value={money(collected)} trend="up" hint="verified payments" />
        <StatCard label="Outstanding" value={money(outstanding)} trend="flat" hint={`${pending.length} pending`} />
        <StatCard label="Payments" value={String(payments.length)} hint="all records" />
        <StatCard label="Awaiting verify" value={String(pending.length)} trend="flat" hint="action needed" />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fee structures</CardTitle>
          <CardDescription>Mandatory fees auto-bill to residents on allocation</CardDescription>
        </CardHeader>
        <CardContent>
          {fs.structures.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No fee structures yet — add one to start billing.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fs.structures.map((st) => (
                <div key={st.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{st.name}</p>
                    <span className="font-semibold text-primary">{money(st.amount)}</span>
                  </div>
                  <p className="text-xs capitalize text-muted-foreground">
                    {st.fee_type.replace(/_/g, " ")} · {st.academic_year} · {st.semester}
                    {st.is_mandatory ? " · mandatory" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gold/30">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Payment verifications</CardTitle>
            <CardDescription>{pending.length} payment(s) awaiting review</CardDescription>
          </div>
          <Badge variant="outline" className="border-warning/30 bg-warning/10 text-gold-foreground">Action needed</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <SkeletonCards count={4} />
          ) : pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nothing to verify right now.</p>
          ) : (
            pending.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{nameOf(p)}</p>
                    <p className="text-xs text-muted-foreground">{p.feeStructure?.name ?? "Hostel fee"}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{money(p.total_amount)}</span>
                      <span>{p.payment_method ?? "—"}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <ViewProofButton paymentId={p.id} />
                  <Button variant="outline" size="sm" className="text-destructive" disabled={busyId === p.id}
                    onClick={() => setRejecting(p)}>
                    <X className="size-4" /> Reject
                  </Button>
                  <Button size="sm" disabled={busyId === p.id} onClick={() => setVerifying(p)}>
                    <Check className="size-4" /> Verify
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Collection overview</CardTitle>
          <CardDescription>Collected vs pending vs overdue (₨)</CardDescription>
        </CardHeader>
        <CardContent>
          {collectionDonut.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No fee data yet.</p>
          ) : (
            <div className="grid items-center gap-6 sm:grid-cols-2">
              <div className="flex justify-center">
                <DonutChart
                  size={200}
                  data={collectionDonut.map((d) => ({ value: d.value, color: d.fill, label: d.name }))}
                  centerContent={
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{Math.round(fees?.collection_rate ?? 0)}%</p>
                      <p className="text-xs text-muted-foreground">collected</p>
                    </div>
                  }
                />
              </div>
              <div className="space-y-2">
                {collectionDonut.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-full" style={{ background: d.fill }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="ml-auto font-medium">{money(d.value)}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 border-t pt-2 text-sm">
                  <span className="text-muted-foreground">Collection rate</span>
                  <span className="ml-auto font-semibold">{Math.round(fees?.collection_rate ?? 0)}%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All payments</CardTitle>
          <DateRangePicker value={dueRange} onChange={setDueRange} placeholder="Filter by due date" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonTable cols={4} />
          ) : visiblePayments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {payments.length === 0 ? "No payments recorded yet." : "No payments due in this period."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiblePayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{nameOf(p)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.feeStructure?.name ?? "Hostel fee"}</TableCell>
                    <TableCell>{money(p.total_amount)}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!verifying}
        onOpenChange={(o) => !o && setVerifying(null)}
        title="Verify payment"
        description={verifying ? `Confirm ${nameOf(verifying)}'s payment of ${money(verifying.total_amount)} as received? Review the uploaded proof first.` : ""}
        confirmLabel="Mark as paid"
        busy={!!verifying && busyId === verifying.id}
        onConfirm={() => { if (verifying) { verify(verifying.id, "paid"); setVerifying(null); } }}
      />

      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title="Reject payment"
        description={rejecting ? `Reject ${nameOf(rejecting)}'s payment of ${money(rejecting.total_amount)}?` : ""}
        confirmLabel="Reject payment"
        destructive
        withReason
        busy={!!rejecting && busyId === rejecting.id}
        onConfirm={(reason) => { if (rejecting) { verify(rejecting.id, "rejected", reason || "Rejected"); setRejecting(null); } }}
      />
    </>
  );
}

// Fetches the resident's uploaded payment proof on demand and opens it.
function ViewProofButton({ paymentId }: { paymentId: string }) {
  const [loading, setLoading] = React.useState(false);
  const open = async () => {
    setLoading(true);
    try {
      const proofs = await feesApi.listProofs(paymentId);
      const url = proofs.find((p) => p.proof_url)?.proof_url;
      const txn = proofs.find((p) => p.transaction_id)?.transaction_id;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else if (txn) {
        toast.info(`Transaction reference: ${txn}`);
      } else {
        toast.info("No proof uploaded for this payment yet.");
      }
    } catch (err) {
      toast.error((err as Error).message || "Could not load proof");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={open} disabled={loading}>
      <Eye className="size-4" /> Proof
    </Button>
  );
}

function FeeStructureDialog({ busy, onCreate }: {
  busy: boolean;
  onCreate: (b: { name: string; fee_type: string; amount: number; academic_year: string; semester: string; room_type_id?: string; is_mandatory?: boolean }) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const types = useAsync(() => roomsApi.roomTypes(), [], { enabled: open });
  const [name, setName] = React.useState("");
  const [feeType, setFeeType] = React.useState("hostel_rent");
  const [amount, setAmount] = React.useState("");
  const [year, setYear] = React.useState("2026-2027");
  const [semester, setSemester] = React.useState("Fall");
  const [roomType, setRoomType] = React.useState("");
  const [mandatory, setMandatory] = React.useState(true);

  const submit = async () => {
    const ok = await onCreate({
      name, fee_type: feeType, amount: Number(amount), academic_year: year, semester,
      room_type_id: roomType || undefined, is_mandatory: mandatory,
    });
    if (ok) { setName(""); setAmount(""); setOpen(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}><Plus className="size-4" /> New fee</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New fee structure</DialogTitle>
          <DialogDescription>Mandatory fees bill automatically when a student is allocated.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="fs-name">Name</Label><Input id="fs-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hostel Rent — Term 1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fee type</Label>
              <SimpleSelect value={feeType} onChange={setFeeType} className="w-full" options={FEE_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))} />
            </div>
            <div className="space-y-1.5"><Label htmlFor="fs-amt">Amount (₨)</Label><Input id="fs-amt" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="fs-year">Academic year</Label><Input id="fs-year" value={year} onChange={(e) => setYear(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="fs-sem">Semester</Label><Input id="fs-sem" value={semester} onChange={(e) => setSemester(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Applies to room type (optional)</Label>
            <SimpleSelect value={roomType} onChange={setRoomType} className="w-full" options={[{ value: "", label: "All room types" }, ...(types.data ?? []).map((t) => ({ value: t.id, label: t.name }))]} />
          </div>
          <Label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Switch checked={mandatory} onCheckedChange={setMandatory} />
            Mandatory (auto-bills on allocation)
          </Label>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!name.trim() || !amount || busy} onClick={submit}>
            Create fee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
