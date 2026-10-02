"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { reportTarget } from "@/lib/db/actions";
import { toast } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, ChoiceCard, Textarea } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";

type Reason = "fake" | "stolen_suspect" | "wrong_info" | "scam" | "other";

/** 🚩 report a listing or shop (goes to the moderation queue). */
export function ReportSheet({ targetType, targetId }: { targetType: "listing" | "vendor"; targetId: string }) {
  const { tx } = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState("");
  const reasons: { id: Reason; icon: string; bn: string; en: string }[] = [
    { id: "fake", icon: "🎭", bn: "নকল / ভুয়া জিনিস", en: "Fake item" },
    { id: "wrong_info", icon: "❌", bn: "তথ্য বা ছবি ভুল", en: "Wrong info or photos" },
    { id: "stolen_suspect", icon: "🚨", bn: "চুরির জিনিস মনে হচ্ছে", en: "Looks stolen" },
    { id: "scam", icon: "💸", bn: "বাইরে টাকা চাইছে / প্রতারণা", en: "Asking to pay outside / scam" },
    { id: "other", icon: "•", bn: "অন্য কিছু", en: "Something else" },
  ];
  return (
    <>
      <Button variant="ghost" size="md" onClick={() => setOpen(true)} className="text-bad">
        <Flag className="size-4" aria-hidden /> {tx("রিপোর্ট করুন", "Report")}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={tx("কী সমস্যা?", "What's wrong?")}>
        <ul className="space-y-2">
          {reasons.map((r) => (
            <li key={r.id}>
              <ChoiceCard icon={r.icon} title={tx(r.bn, r.en)} selected={reason === r.id} tone="bad" onClick={() => setReason(r.id)} />
            </li>
          ))}
        </ul>
        <Textarea className="mt-3" value={details} onChange={(e) => setDetails(e.target.value)} placeholder={tx("আরও কিছু বলতে চাইলে লিখুন (ঐচ্ছিক)", "Anything else? (optional)")} />
        <Button
          variant="danger"
          size="lg"
          full
          className="my-4"
          disabled={!reason}
          onClick={() => {
            reportTarget(targetType, targetId, reason!, details.trim() || null);
            toast(tx("ধন্যবাদ, আমাদের টিম দেখবে", "Thanks, our team will review it"));
            setOpen(false);
            setReason(null);
            setDetails("");
          }}
        >
          🚩 {tx("রিপোর্ট পাঠান", "Send report")}
        </Button>
      </Sheet>
    </>
  );
}
