"use client";

import { Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { cancelRequest, extendRequest } from "@/lib/db/actions";
import { settings } from "@/lib/mock/settings";
import type { PartRequest } from "@/lib/types";
import { toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, ChoiceCard } from "../../ui/primitives";
import { Sheet } from "../../ui/Sheet";

/** Extend the deadline or cancel (file 00 §7.2 / §13). */
export function RequestActions({ r }: { r: PartRequest }) {
  const { tx, d } = useT();
  const [cancelOpen, setCancelOpen] = useState(false);
  const live = ["new", "needs_clarification", "open", "quotes_received", "expired"].includes(r.status);
  if (!live) return null;
  const reasons = [
    { bn: "অন্য জায়গা থেকে পেয়ে গেছি", en: "Found it elsewhere" },
    { bn: "আর লাগবে না", en: "Don't need it anymore" },
    { bn: "দাম বেশি", en: "Prices too high" },
    { bn: "ভুল করে দিয়েছি", en: "Sent by mistake" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        onClick={() => {
          extendRequest(r.id);
          toast(tx(`মেয়াদ আরও ${d(settings.request_expiry_hours)} ঘণ্টা বাড়ানো হয়েছে`, `Extended by ${settings.request_expiry_hours} hours`));
        }}
      >
        <Clock className="size-4" aria-hidden /> {tx("মেয়াদ বাড়ান", "Extend")}
      </Button>
      <Button variant="danger" onClick={() => setCancelOpen(true)}>
        <XCircle className="size-4" aria-hidden /> {tx("বাতিল করুন", "Cancel")}
      </Button>
      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} title={tx("কেন বাতিল করছেন?", "Why cancel?")}>
        <div className="space-y-2 pb-2">
          {reasons.map((x) => (
            <ChoiceCard
              key={x.en}
              icon="✖️"
              title={tx(x.bn, x.en)}
              onClick={() => {
                cancelRequest(r.id, x.bn);
                setCancelOpen(false);
                toast(tx("রিকোয়েস্ট বাতিল হয়েছে", "Request cancelled"), "info");
              }}
            />
          ))}
          <Button variant="ghost" full onClick={() => setCancelOpen(false)}>
            {tx("না, রেখে দিন", "No, keep it")}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
