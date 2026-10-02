"use client";

import { useState } from "react";
import { cancelRequest } from "@/lib/store";
import { useT } from "../providers/LangProvider";
import { Button, Chip, Textarea } from "../ui/primitives";
import { Sheet } from "./Sheet";

// ❌ "দরকার নেই" with an optional reason (spec 7.9).
export function CancelSheet({ requestId, open, onClose }: { requestId: string; open: boolean; onClose: () => void }) {
  const { tx } = useT();
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const reasons = [
    tx("অন্য জায়গায় পেয়ে গেছি", "Found it elsewhere"),
    tx("দাম বেশি মনে হচ্ছে", "Price is too high"),
    tx("অনেক সময় লাগবে", "Takes too long"),
    tx("গাড়ি ঠিক হয়ে গেছে", "Car got fixed"),
    tx("ভুল করে দিয়েছিলাম", "Sent by mistake"),
  ];

  const confirm = () => {
    const full = [reason, note.trim()].filter(Boolean).join(" · ");
    cancelRequest(requestId, full || null);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={tx("রিকোয়েস্ট বাতিল করবেন?", "Cancel this request?")}>
      <div className="space-y-4">
        <p className="text-muted">{tx("কেন দরকার নেই? বলা ঐচ্ছিক, এতে আমরা সার্ভিস ভালো করতে পারি।", "Why? Optional, but it helps us improve.")}</p>
        <div className="flex flex-wrap gap-2">
          {reasons.map((r) => (
            <Chip key={r} active={reason === r} onClick={() => setReason(reason === r ? null : r)} className="min-h-11">
              {r}
            </Chip>
          ))}
        </div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="min-h-20"
          placeholder={tx("অন্য কিছু বলতে চাইলে লিখুন (ঐচ্ছিক)", "Anything else? (optional)")}
          aria-label={tx("কারণ", "Reason")}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={onClose}>
            {tx("না, রাখুন", "No, keep it")}
          </Button>
          <Button variant="danger" size="lg" onClick={confirm}>
            {tx("হ্যাঁ, বাতিল", "Yes, cancel")}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
