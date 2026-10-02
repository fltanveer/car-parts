"use client";

import { Bell, BellRing, MessageCircle, PhoneCall } from "lucide-react";
import { useState } from "react";
import { requestCallback, toggleFollow } from "@/lib/db/actions";
import { useDb } from "@/lib/db/store";
import type { Vendor } from "@/lib/types";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { Stars, VerifiedBadge } from "@/components/shared/Badges";
import { ShopLogo, toast } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, Notice } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { MarketLine } from "./Bits";
import { myProfile } from "./data";
import { OpenPill } from "./ShopCard";
import { useAskShop, useRequireLogin } from "./useAskShop";

const DAYS_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const hourLabel = (h: number, lang: "bn" | "en", d: (n: number) => string) => {
  if (lang === "en") return `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
  const part = h < 12 ? "সকাল" : h < 16 ? "দুপুর" : h < 18 ? "বিকাল" : h < 20 ? "সন্ধ্যা" : "রাত";
  return `${part} ${d(h % 12 || 12)}টা`;
};

/** Cover, logo, badges (tap = explanation), follow, message, call request (no phone shown). */
export function ShopHeader({ vendor }: { vendor: Vendor }) {
  const { tx, lang, d } = useT();
  const ask = useAskShop();
  const requireLogin = useRequireLogin();
  const profile = useDb(myProfile);
  const following = !!profile?.followed_vendor_ids.includes(vendor.id);
  const [callOpen, setCallOpen] = useState(false);
  const name = lang === "bn" ? vendor.shop_name_bn : vendor.shop_name;
  const days = vendor.opening_hours.days.map((x) => (lang === "bn" ? DAYS_BN[x] : DAYS_EN[x])).join(", ");

  return (
    <header className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="h-24 sm:h-32" style={{ background: `linear-gradient(135deg, ${vendor.logo_color}, ${vendor.logo_color}99)` }} aria-hidden />
      <div className="px-4 pb-4">
        <div className="-mt-8 flex items-end justify-between gap-3">
          <span className="rounded-full ring-4 ring-card">
            <ShopLogo name={name} color={vendor.logo_color} size="lg" />
          </span>
          <AudioGuide compact text={tx(`${vendor.shop_name_bn}। ফলো করলে নতুন পণ্য এলে জানাবো। প্রশ্ন থাকলে মেসেজ দিন বা কল অনুরোধ করুন, দোকান আপনাকে ফোন করবে।`, `${vendor.shop_name}. Follow to hear about new products. Message the shop or request a call and they'll call you back.`)} />
        </div>
        <h1 className="mt-2 text-2xl font-bold">{name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Stars value={vendor.rating_avg} count={vendor.rating_count} size="md" />
          <VerifiedBadge vendor={vendor} />
          {vendor.badges.includes("assured_partner") && <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-ink">✔️ Assured {tx("পার্টনার", "partner")}</span>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <MarketLine vendor={vendor} />
          <OpenPill vendor={vendor} />
        </div>
        <p className="mt-1 text-sm text-ink-2">
          🕘 {hourLabel(vendor.opening_hours.open, lang, d)} – {hourLabel(vendor.opening_hours.close, lang, d)} · {days}
        </p>
        {vendor.holiday_mode && <Notice tone="wait" className="mt-2">{tx("দোকান এখন ছুটিতে আছে", "Shop is on holiday")}</Notice>}
        {vendor.description_bn && <p className="mt-2 text-ink-2">{vendor.description_bn}</p>}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button
            variant={following ? "ok" : "brand"}
            size="md"
            className="h-auto flex-col gap-1 py-2 text-sm"
            aria-pressed={following}
            onClick={() => {
              if (!requireLogin()) return;
              toggleFollow(vendor.id);
              toast(following ? tx("ফলো বন্ধ করা হয়েছে", "Unfollowed") : tx("ফলো করছেন, নতুন পণ্য এলে জানাবো", "Following — we'll tell you about new items"));
            }}
          >
            {following ? <BellRing className="size-5" aria-hidden /> : <Bell className="size-5" aria-hidden />}
            {following ? tx("ফলো করছেন", "Following") : tx("ফলো", "Follow")}
          </Button>
          <Button variant="outline" size="md" className="h-auto flex-col gap-1 py-2 text-sm" onClick={() => ask(vendor.id)}>
            <MessageCircle className="size-5" aria-hidden /> {tx("মেসেজ", "Message")}
          </Button>
          <Button variant="outline" size="md" className="h-auto flex-col gap-1 py-2 text-sm" onClick={() => { if (requireLogin()) setCallOpen(true); }}>
            <PhoneCall className="size-5 text-ok" aria-hidden /> {tx("কল অনুরোধ", "Call me")}
          </Button>
        </div>
      </div>

      <Sheet open={callOpen} onClose={() => setCallOpen(false)} title={tx("দোকান আপনাকে কল করবে", "The shop will call you")}>
        <p className="text-lg">{tx("দোকানের নম্বর দেখানো হয় না। অনুরোধ পাঠালে দোকান বা আমাদের টিম আপনার নম্বরে কল করবে।", "Shop numbers aren't shown. Send a request and the shop or our team will call your number.")}</p>
        <Notice className="mt-3">{tx("অ্যাপের বাইরে টাকা দিলে টাকা ফেরতের সুরক্ষা পাবেন না।", "Paying outside the app means no refund protection.")}</Notice>
        <Button
          variant="ok"
          size="lg"
          full
          className="my-4"
          onClick={() => {
            requestCallback("vendor", vendor.id, `${vendor.shop_name_bn} · দোকানের পেজ থেকে`);
            toast(tx("অনুরোধ পাঠানো হয়েছে, শীঘ্রই কল পাবেন", "Request sent, you'll get a call soon"));
            setCallOpen(false);
          }}
        >
          <PhoneCall className="size-5" aria-hidden /> {tx("কল অনুরোধ পাঠান", "Send call request")}
        </Button>
      </Sheet>
    </header>
  );
}
