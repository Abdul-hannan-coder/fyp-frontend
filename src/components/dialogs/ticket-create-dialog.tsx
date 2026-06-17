"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SimpleSelect from "@/components/ui/simple-select";

const CATEGORIES = [
  { value: "room_issue", label: "Room issue" },
  { value: "payment_issue", label: "Payment issue" },
  { value: "allocation_issue", label: "Allocation issue" },
  { value: "facility_issue", label: "Facility issue" },
  { value: "other", label: "Other" },
];
const PRIORITIES = ["low", "medium", "high"];

export function TicketCreateDialog({
  onCreate,
}: {
  onCreate: (body: { category: string; subject: string; description: string; priority: string }) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [category, setCategory] = React.useState("facility_issue");
  const [priority, setPriority] = React.useState("medium");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");

  const subjectOk = subject.trim().length >= 3;
  const descOk = description.trim().length >= 10;
  const valid = subjectOk && descOk;

  const submit = async () => {
    setBusy(true);
    const ok = await onCreate({ category, subject, description, priority });
    setBusy(false);
    if (ok) {
      setSubject("");
      setDescription("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> New ticket
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise a ticket</DialogTitle>
          <DialogDescription>Tell us what&apos;s wrong and we&apos;ll get on it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-subject">Subject</Label>
            <Input id="t-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. AC not cooling" />
            {subject.length > 0 && !subjectOk && (
              <p className="text-xs text-destructive">Subject must be at least 3 characters.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue (min 10 characters)…" />
            <p className={`text-xs ${descOk ? "text-muted-foreground" : "text-destructive"}`}>
              {description.trim().length}/10 characters minimum
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <SimpleSelect value={category} onChange={setCategory} className="w-full" options={CATEGORIES} />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <SimpleSelect value={priority} onChange={setPriority} className="w-full" options={PRIORITIES} />
            </div>
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button disabled={!valid || busy} onClick={submit}>
            {busy && <Loader2 className="size-4 animate-spin" />} Submit ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
