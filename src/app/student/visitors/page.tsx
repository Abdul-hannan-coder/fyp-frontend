"use client";

import * as React from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useVisitors, visitorsApi } from "@/lib/features/visitors";
import { useMyAllocation } from "@/lib/features/allocation/useAllocation";

export default function StudentVisitors() {
  const { visitors, loading, error, refetch } = useVisitors("mine");
  const { allocation } = useMyAllocation();

  return (
    <>
      <PageHeader title="My visitors" description="Register and track your guests.">
        <RegisterDialog defaultRoom={allocation?.room?.room_number ?? ""} onDone={refetch} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Currently inside" value={String(visitors.filter((v) => v.status === "checked_in").length)} trend="flat" hint="checked in" />
        <StatCard label="Total" value={String(visitors.length)} hint="all time" />
        <StatCard label="Checked out" value={String(visitors.filter((v) => v.status === "checked_out").length)} hint="left" />
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Visitor history</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          ) : visitors.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No visitors yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell className="text-muted-foreground">{v.visit_date ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{v.purpose ?? "—"}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={v.status} /></TableCell>
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

function RegisterDialog({ defaultRoom, onDone }: { defaultRoom: string; onDone: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [purpose, setPurpose] = React.useState("");
  const [room, setRoom] = React.useState(defaultRoom);
  const [date, setDate] = React.useState("");

  React.useEffect(() => setRoom(defaultRoom), [defaultRoom]);

  const valid = name.trim() && phone.trim() && room.trim() && date;

  const submit = async () => {
    setBusy(true);
    try {
      await visitorsApi.register({ name, phone, purpose: purpose || "Visit", visit_date: date, room_number: room });
      toast.success("Visitor registered");
      onDone();
      setName(""); setPhone(""); setPurpose(""); setDate("");
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <UserPlus className="size-4" /> Register visitor
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register a visitor</DialogTitle>
          <DialogDescription>Let the front desk know who&apos;s coming to see you.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="v-name">Visitor name</Label>
            <Input id="v-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="v-phone">Phone</Label>
              <Input id="v-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-room">Room</Label>
              <Input id="v-room" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. A-204" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="v-date">Visit date</Label>
              <Input id="v-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-purpose">Purpose</Label>
              <Input id="v-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Family visit" />
            </div>
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!valid || busy} onClick={submit}>
            {busy && <Loader2 className="size-4 animate-spin" />} Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
