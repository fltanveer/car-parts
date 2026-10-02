"use client";

import { BellRing, Check } from "lucide-react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button } from "@/components/ui/primitives";
import { iso } from "@/lib/db/seed";
import { getDb, update, useDb } from "@/lib/db/store";

/** "Notify me when this launches" → DB `serviceInterest`. */
export function InterestButton({ service, label }: { service: string; label?: string }) {
  const { tx, d } = useT();
  const me = useDb((s) => s.staff.find((x) => x.id === s.session.staffId) ?? null);
  const all = useDb((s) => s.serviceInterest.filter((x) => x.service === service));
  const mine = !!me && all.some((x) => x.phone === me.phone);

  const register = () => {
    const st = getDb().staff.find((x) => x.id === getDb().session.staffId);
    if (!st) return toast(tx("আগে স্টাফ বাছাই করুন", "Select a staff member first"), "bad");
    update((s) => ({ serviceInterest: [{ service, area: "admin", phone: st.phone, at: iso() }, ...s.serviceInterest] }));
    toast(tx("চালু হলে আপনাকে জানানো হবে", "We'll notify you when it launches"));
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant={mine ? "outline" : "brand"} size="lg" onClick={register} disabled={mine}>
        {mine ? <Check className="size-5" aria-hidden /> : <BellRing className="size-5" aria-hidden />}
        {mine ? tx("আগ্রহ জানানো হয়েছে", "Interest registered") : (label ?? tx("চালু হলে জানান", "Notify me"))}
      </Button>
      <span className="text-sm text-muted">{tx(`${d(all.length)} জন আগ্রহ জানিয়েছে`, `${all.length} registered`)}</span>
    </div>
  );
}
