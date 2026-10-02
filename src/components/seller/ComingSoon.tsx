"use client";

import { useState } from "react";
import { registerInterest } from "@/lib/db/actions-seller";
import { useDb } from "@/lib/db/store";
import type { Vendor } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { toast } from "../shared/Misc";
import { Button, Card, Notice } from "../ui/primitives";
import { SellerPage } from "./SellerPage";

/** Phase-2 placeholder with what's coming + "notify me" sign-up. */
export function ComingSoon({ vendor, service, icon, title, items }: { vendor: Vendor; service: string; icon: string; title: string; items: { icon: string; text: string }[] }) {
  const { tx } = useT();
  const already = useDb((s) => s.serviceInterest.some((x) => x.service === service && x.phone === vendor.owner_phone));
  const [done, setDone] = useState(false);
  return (
    <SellerPage title={`${icon} ${title}`} subtitle={tx("শীঘ্রই আসছে", "Coming soon")} back="/seller/more" guide={tx("এই অংশ এখনো চালু হয়নি। আগ্রহী হলে নিচের বাটন চাপুন, চালু হলে আপনাকে জানাবো।", "This isn't live yet. Tap the button below and we'll tell you when it launches.")}>
      <Card className="space-y-3 p-4">
        <p className="font-bold">{tx("যা যা থাকবে", "What's coming")}</p>
        {items.map((it) => (
          <p key={it.text} className="flex gap-2"><span>{it.icon}</span><span>{it.text}</span></p>
        ))}
      </Card>
      {already || done ? (
        <Notice tone="ok">✅ {tx("আপনার আগ্রহ জমা আছে। চালু হলে SMS পাবেন।", "You're on the list. We'll SMS you at launch.")}</Notice>
      ) : (
        <Button variant="brand" size="xl" full onClick={() => { registerInterest(service, vendor.market_area, vendor.owner_phone); setDone(true); toast(tx("ধন্যবাদ! চালু হলে জানাবো", "Thanks! We'll let you know")); }}>
          🙋 {tx("আমি আগ্রহী, জানাবেন", "I'm interested, notify me")}
        </Button>
      )}
    </SellerPage>
  );
}
