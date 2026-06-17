"use client";

import * as React from "react";
import { Plus } from "lucide-react";
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
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITIES,
  type CreateAnnouncementInput,
} from "@/lib/features/announcements";
import SimpleSelect from "@/components/ui/simple-select";

export function AnnouncementCreateDialog({
  busy,
  onCreate,
}: {
  busy: boolean;
  onCreate: (input: CreateAnnouncementInput) => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState("general");
  const [priority, setPriority] = React.useState("medium");

  const reset = () => {
    setTitle("");
    setContent("");
    setCategory("general");
    setPriority("medium");
  };

  const submit = async (publish: boolean) => {
    const ok = await onCreate({ title, content, category, priority, publish });
    if (ok) {
      reset();
      setOpen(false);
    }
  };

  const valid = title.trim() && content.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> New announcement
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
          <DialogDescription>Broadcast a notice to residents.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Title</Label>
            <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Water maintenance" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-content">Content</Label>
            <Textarea id="ann-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write the announcement…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <SimpleSelect
                value={category}
                onChange={setCategory}
                className="w-full"
                options={ANNOUNCEMENT_CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, " ") }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <SimpleSelect
                value={priority}
                onChange={setPriority}
                className="w-full"
                options={ANNOUNCEMENT_PRIORITIES.map((p) => ({ value: p, label: p }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button variant="outline" disabled={!valid || busy} onClick={() => submit(false)}>
            Save draft
          </Button>
          <Button disabled={!valid || busy} onClick={() => submit(true)}>
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
