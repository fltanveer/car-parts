"use client";

import { type ReactNode, useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Chip, Field, Textarea } from "@/components/ui/primitives";

/**
 * Confirmation dialog that requires a reason (cancel, reject, consent note…).
 * Quick-reason chips avoid typing for the common cases.
 */
export function ReasonSheet({
  open, onClose, title, label, presets = [], confirmLabel, tone = "danger", onSubmit, children, minLength = 3,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  label?: ReactNode;
  presets?: string[];
  confirmLabel: ReactNode;
  tone?: "danger" | "ok" | "brand";
  onSubmit: (reason: string) => void;
  children?: ReactNode;
  minLength?: number;
}) {
  const { tx } = useT();
  const [reason, setReason] = useState("");
  const ok = reason.trim().length >= minLength;
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="space-y-3 pb-2">
        {children}
        {presets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Chip key={p} active={reason === p} onClick={() => setReason(p)}>
                {p}
              </Chip>
            ))}
          </div>
        )}
        <Field label={label ?? tx("কারণ (বাধ্যতামূলক)", "Reason (required)")}>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <Button
          full
          size="lg"
          variant={tone === "danger" ? "danger" : tone === "ok" ? "ok" : "brand"}
          disabled={!ok}
          onClick={() => {
            onSubmit(reason.trim());
            setReason("");
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
