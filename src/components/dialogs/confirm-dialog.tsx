"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Reusable confirmation modal — replaces window.confirm / window.prompt.
 * Optionally collects a reason. Controlled via `open`/`onOpenChange`.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  withReason = false,
  reasonLabel = "Reason",
  reasonRequired = false,
  reasonPlaceholder,
  busy = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  withReason?: boolean;
  reasonLabel?: string;
  reasonRequired?: boolean;
  reasonPlaceholder?: string;
  busy?: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");
  React.useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const canConfirm = !withReason || !reasonRequired || reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {withReason && (
          <div className="space-y-1.5">
            <Label htmlFor="confirm-reason">{reasonLabel}</Label>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder ?? "Add a note…"}
            />
          </div>
        )}
        <DialogFooter showCloseButton>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={busy || !canConfirm}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
