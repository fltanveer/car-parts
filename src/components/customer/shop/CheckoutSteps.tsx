"use client";

import { Building2, Home, ShieldPlus, Store, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { settings } from "@/lib/mock/settings";
import { largestSize, type PaymentOption } from "@/lib/rules";
import { paymentMethodLabel } from "@/lib/labels";
import type { Fulfillment } from "@/lib/types";
import { useT } from "@/components/providers/LangProvider";
import { ChoiceCard, Toggle } from "@/components/ui/primitives";
import { groupDelivery, type CartGroupData } from "./cart";

export const fulfillmentOptions = (g: CartGroupData): Fulfillment[] => {
  const out: Fulfillment[] = ["platform_pickup"];
  if (largestSize(g.sizes) === "large_heavy") out.push("vendor_ship");
  if (g.vendor.allows_store_pickup) out.push("store_pickup");
  if (settings.feature_flags.assured && g.assuredEligible) out.push("assured_hub");
  return out;
};

/** Numbered step box; later steps stay dimmed until earlier ones are done. */
export function StepBox({ n, title, done, disabled, children }: { n: number; title: ReactNode; done?: boolean; disabled?: boolean; children: ReactNode }) {
  const { d } = useT();
  return (
    <section className={`rounded-2xl border-2 bg-card p-4 ${done ? "border-ok/40" : "border-line"} ${disabled ? "pointer-events-none opacity-50" : ""}`} inert={disabled}>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm ${done ? "bg-ok text-white" : "bg-ink text-white"}`}>{done ? "✓" : d(n)}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** How each shop's parcel reaches you, optionally "same for all" (file 01 6.2 step 3). */
export function DeliveryStep({ groups, district, value, onChange, sameForAll, onSameForAll }: { groups: CartGroupData[]; district: string; value: Record<string, Fulfillment>; onChange: (v: Record<string, Fulfillment>) => void; sameForAll: boolean; onSameForAll: (v: boolean) => void }) {
  const { tx, lang, taka, d } = useT();
  const meta: Record<Fulfillment, { icon: ReactNode; bn: string; en: string; sub_bn: string; sub_en: string }> = {
    platform_pickup: { icon: <Home className="size-5" />, bn: "বাসায় ডেলিভারি", en: "Home delivery", sub_bn: "রাইডার দোকান থেকে তুলে আপনার ঠিকানায় দেবে", sub_en: "Rider collects from the shop and delivers" },
    vendor_ship: { icon: <Building2 className="size-5" />, bn: "কুরিয়ার শাখা থেকে নেবো (ভারী জিনিস)", en: "Collect at courier branch (heavy item)", sub_bn: "দোকান কুরিয়ারে দেবে, আপনি কাছের শাখা থেকে নেবেন", sub_en: "Shop sends by courier, you collect at the branch" },
    store_pickup: { icon: <Store className="size-5" />, bn: "দোকান থেকে নিজে নেবো", en: "I'll collect from the shop", sub_bn: "পিকআপ কোড দেখিয়ে নেবেন, ডেলিভারি চার্জ নেই", sub_en: "Show the pickup code, no delivery charge" },
    assured_hub: { icon: <ShieldPlus className="size-5" />, bn: "Assured হয়ে (যাচাই করে পাঠানো)", en: "Via Assured (checked first)", sub_bn: "আমাদের হাবে মিলিয়ে দেখে পাঠাবে, একটু বেশি সময় লাগে", sub_en: "Checked at our hub before sending, takes a bit longer" },
  };
  const pick = (vendorId: string, f: Fulfillment) => {
    if (!sameForAll) return onChange({ ...value, [vendorId]: f });
    const next = { ...value };
    groups.forEach((g) => {
      if (fulfillmentOptions(g).includes(f)) next[g.vendor.id] = f;
    });
    onChange(next);
  };
  return (
    <div className="space-y-4">
      {groups.length > 1 && (
        <div className="rounded-xl border border-line px-3">
          <Toggle checked={sameForAll} onChange={onSameForAll} label={tx("সবগুলোতে একই", "Same for all shops")} />
        </div>
      )}
      {groups.map((g, i) => (
        <div key={g.vendor.id}>
          <p className="mb-2 flex items-center gap-1.5 font-semibold">
            <Truck className="size-4 text-muted" aria-hidden /> {tx(`প্যাকেট ${d(i + 1)}`, `Parcel ${i + 1}`)}: {lang === "bn" ? g.vendor.shop_name_bn : g.vendor.shop_name}
          </p>
          <div className="space-y-2">
            {fulfillmentOptions(g).map((f) => {
              const charge = groupDelivery(g, district, f);
              return (
                <ChoiceCard
                  key={f}
                  selected={(value[g.vendor.id] ?? "platform_pickup") === f}
                  onClick={() => pick(g.vendor.id, f)}
                  icon={meta[f].icon}
                  title={
                    <span className="flex flex-wrap items-center justify-between gap-x-2">
                      <span>{lang === "bn" ? meta[f].bn : meta[f].en}</span>
                      <span className="text-sm">{charge ? taka(charge) : tx("ফ্রি", "Free")}</span>
                    </span>
                  }
                  subtitle={lang === "bn" ? meta[f].sub_bn : meta[f].sub_en}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Payment options computed by rules (file 00 8.2). */
export function PaymentStep({ options, value, onChange }: { options: PaymentOption[]; value: PaymentOption["method"] | null; onChange: (m: PaymentOption["method"]) => void }) {
  const { tx, L, taka } = useT();
  const icon = { cod: "💵", delivery_advance_cod: "📲", online: "💳", manual_advance: "📲" };
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <ChoiceCard
          key={o.method}
          selected={value === o.method}
          onClick={() => onChange(o.method)}
          tone="ok"
          icon={icon[o.method]}
          title={
            <span className="flex flex-wrap items-center gap-2">
              {L(paymentMethodLabel[o.method])}
              {o.recommended && <span className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-bold text-ok">{tx("প্রস্তাবিত", "Recommended")}</span>}
            </span>
          }
          subtitle={
            o.method === "online"
              ? tx(`এখন ${taka(o.advance)} · টাকা আমাদের কাছে নিরাপদ থাকবে`, `Pay ${taka(o.advance)} now · held safely by us`)
              : o.advance
                ? tx(`এখন ${taka(o.advance)} (bKash/Nagad) · পৌঁছালে ${taka(o.cod)}`, `Now ${taka(o.advance)} (bKash/Nagad) · on delivery ${taka(o.cod)}`)
                : tx(`পৌঁছালে পুরো ${taka(o.cod)}`, `Pay ${taka(o.cod)} on delivery`)
          }
        />
      ))}
    </div>
  );
}
