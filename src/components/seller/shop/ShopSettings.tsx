"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { updateVendor } from "@/lib/db/actions";
import { logActivity } from "@/lib/db/actions-seller";
import { makes, markets, topCategories } from "@/lib/db/queries";
import { fulfillmentLabel } from "@/lib/labels";
import { settings } from "@/lib/mock/settings";
import type { Fulfillment, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { MakeLogo, ShopLogo, toast } from "../../shared/Misc";
import { CategoryIcon } from "../../ui/CategoryIcon";
import { Button, Card, Field, Notice, SectionTitle, Select, Stepper, Toggle } from "../../ui/primitives";
import { OptionGrid, ReturnsPicker, WarrantyPicker } from "../Choices";
import { VoiceInput, VoiceTextarea } from "../Dictate";
import { PayoutMethods } from "../verify/PayoutMethods";
import { useLocalDraft, verificationProgress } from "../utils";
import { SellerPage } from "../SellerPage";
import { GpsButton } from "./GpsButton";

const COLORS = ["#0f766e", "#1d4ed8", "#7c2d12", "#9d174d", "#a16207", "#111827", "#4338ca", "#15803d"];
const DAYS = { bn: ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
type Form = Pick<Vendor, "shop_name" | "shop_name_bn" | "logo_color" | "description_bn" | "market_area" | "address" | "lat" | "lng" | "opening_hours" | "holiday_mode" | "specialty_makes" | "specialty_categories" | "accepts_requests" | "request_daily_limit" | "default_return_days" | "default_warranty_days" | "default_fulfillment" | "allows_store_pickup">;

export function ShopSettings({ vendor }: { vendor: Vendor }) {
  const { tx, d, L, lang } = useT();
  const pick = (v: Vendor): Form => ({
    shop_name: v.shop_name, shop_name_bn: v.shop_name_bn, logo_color: v.logo_color, description_bn: v.description_bn, market_area: v.market_area, address: v.address,
    lat: v.lat, lng: v.lng, opening_hours: v.opening_hours, holiday_mode: v.holiday_mode, specialty_makes: v.specialty_makes, specialty_categories: v.specialty_categories,
    accepts_requests: v.accepts_requests, request_daily_limit: v.request_daily_limit, default_return_days: v.default_return_days, default_warranty_days: v.default_warranty_days,
    default_fulfillment: v.default_fulfillment, allows_store_pickup: v.allows_store_pickup,
  });
  const [f, setF] = useState<Form>(() => pick(vendor));
  const [notif, setNotif] = useLocalDraft(`gaarihub:seller-notify:${vendor.id}`, { sound: true, sms: true, smsRequests: true, smsMessages: true });
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));
  const toggleIn = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const changed = JSON.stringify(f) !== JSON.stringify(pick(vendor));
  const vp = verificationProgress(vendor);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const offDays = [0, 1, 2, 3, 4, 5, 6].filter((x) => !f.opening_hours.days.includes(x));
  const fulfilOpts: Fulfillment[] = ["platform_pickup", "vendor_ship", ...(settings.feature_flags.assured ? (["assured_hub"] as Fulfillment[]) : [])];

  const save = () => {
    updateVendor(vendor.id, f);
    logActivity(vendor.id, "দোকান সেটিংস বদল");
    toast(tx("সেভ হয়েছে ✅", "Saved ✅"));
  };

  return (
    <SellerPage
      title={tx("🏪 দোকান সেটিংস", "🏪 Shop settings")}
      guide={tx("দোকানের নাম, ঠিকানা, খোলার সময় আর নিয়ম এখানে। বদলানোর পর নিচের সবুজ বাটনে সেভ করুন।", "Shop name, address, hours and rules. Save with the green button at the bottom.")}
    >
      <section className="space-y-3">
        <SectionTitle>{tx("দোকান", "Shop")}</SectionTitle>
        <Card className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <ShopLogo name={f.shop_name_bn} color={f.logo_color} size="lg" />
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => <button key={c} type="button" aria-label={c} onClick={() => set({ logo_color: c })} className={clsx("size-10 rounded-full", f.logo_color === c && "ring-4 ring-ink/40")} style={{ background: c }} />)}
            </div>
          </div>
          <Field label={tx("দোকানের নাম (বাংলা)", "Shop name (Bangla)")}><VoiceInput value={f.shop_name_bn} onChange={(shop_name_bn) => set({ shop_name_bn })} /></Field>
          <Field label={tx("দোকানের নাম (ইংরেজি)", "Shop name (English)")}><VoiceInput value={f.shop_name} onChange={(shop_name) => set({ shop_name })} /></Field>
          <Field label={tx("বিবরণ", "Description")}><VoiceTextarea value={f.description_bn ?? ""} onChange={(v) => set({ description_bn: v || null })} /></Field>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle>📍 {tx("ঠিকানা", "Location")}</SectionTitle>
        <Card className="space-y-4 p-4">
          <OptionGrid value={f.market_area} onChange={(market_area) => set({ market_area })} options={markets.map((m) => ({ value: m.id, title: L(m) }))} />
          <Field label={tx("ঠিকানা", "Address")}><VoiceInput value={f.address} onChange={(address) => set({ address })} /></Field>
          <GpsButton lat={f.lat} lng={f.lng} onChange={(lat, lng) => set({ lat, lng })} />
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle>🕘 {tx("খোলার সময়", "Opening hours")}</SectionTitle>
        <Card className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((x) => (
              <button key={x} type="button" onClick={() => set({ opening_hours: { ...f.opening_hours, days: toggleIn(f.opening_hours.days, x).sort() } })} className={clsx("min-h-12 min-w-14 rounded-xl border-2 px-2 font-bold", f.opening_hours.days.includes(x) ? "border-ok bg-ok-soft text-ok" : "border-line bg-card text-muted line-through")}>
                {lang === "bn" ? DAYS.bn[x] : DAYS.en[x]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={tx("খোলে", "Opens")}>
              <Select value={f.opening_hours.open} onChange={(e) => set({ opening_hours: { ...f.opening_hours, open: Number(e.target.value) } })}>
                {hours.map((h) => <option key={h} value={h}>{d(h)}:{d("00")}</option>)}
              </Select>
            </Field>
            <Field label={tx("বন্ধ হয়", "Closes")}>
              <Select value={f.opening_hours.close} onChange={(e) => set({ opening_hours: { ...f.opening_hours, close: Number(e.target.value) } })}>
                {hours.filter((h) => h > f.opening_hours.open).map((h) => <option key={h} value={h}>{d(h)}:{d("00")}</option>)}
              </Select>
            </Field>
          </div>
          <p className="text-sm">🗓️ {tx("সাপ্তাহিক ছুটি", "Weekly off")}: <b>{offDays.length ? offDays.map((x) => (lang === "bn" ? DAYS.bn[x] : DAYS.en[x])).join(", ") : tx("নেই", "None")}</b></p>
          <Toggle size="lg" checked={f.holiday_mode} onChange={(holiday_mode) => set({ holiday_mode })} label={tx("🏖️ ছুটির মোড (সব পণ্য লুকানো, অর্ডার নেবে না)", "🏖️ Holiday mode (hide products, no orders)")} />
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle>🚗 {tx("বিশেষত্ব ও দাম চাওয়া", "Specialty & requests")}</SectionTitle>
        <Card className="space-y-4 p-4">
          <p className="font-semibold">{tx("কোন গাড়ির পার্টস বেশি?", "Which car brands?")}</p>
          <div className="grid grid-cols-3 gap-2">
            {makes.map((m) => (
              <button key={m.id} type="button" onClick={() => set({ specialty_makes: toggleIn(f.specialty_makes, m.id) })} className={clsx("flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2", f.specialty_makes.includes(m.id) ? "border-ok bg-ok-soft" : "border-line bg-card")}>
                <MakeLogo make={m} size="sm" />
                <span className="text-xs font-semibold">{lang === "bn" ? m.name_bn : m.name}</span>
              </button>
            ))}
          </div>
          <p className="font-semibold">{tx("কোন ধরনের জিনিস?", "Which categories?")}</p>
          <div className="grid grid-cols-3 gap-2">
            {topCategories().map((c) => (
              <button key={c.id} type="button" onClick={() => set({ specialty_categories: toggleIn(f.specialty_categories, c.id) })} className={clsx("flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-1 text-center", f.specialty_categories.includes(c.id) ? "border-ok bg-ok-soft" : "border-line bg-card")}>
                <CategoryIcon icon={c.icon} className="size-6" />
                <span className="text-xs font-semibold leading-tight">{lang === "bn" ? c.name_bn : c.name}</span>
              </button>
            ))}
          </div>
          <Toggle size="lg" checked={f.accepts_requests} onChange={(accepts_requests) => set({ accepts_requests })} label={tx("🙋 দাম চাওয়া রিকোয়েস্ট পেতে চাই", "🙋 I want price requests")} />
          {vendor.verification_level < 2 && f.accepts_requests && <Notice tone="wait">{tx("রিকোয়েস্টে দাম দিতে স্তর ২ যাচাই লাগবে।", "Quoting needs level 2 verification.")}</Notice>}
          <div className="flex items-center justify-between">
            <span className="font-semibold">{tx("দিনে সর্বোচ্চ রিকোয়েস্ট", "Max requests per day")}</span>
            <Stepper value={f.request_daily_limit} onChange={(request_daily_limit) => set({ request_daily_limit })} min={1} max={200} />
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle>🛡️ {tx("ডিফল্ট নিয়ম", "Default rules")}</SectionTitle>
        <Card className="space-y-4 p-4">
          <ReturnsPicker returnable={f.default_return_days > 0} days={Math.max(settings.return_window_days, f.default_return_days)} onChange={(r, days) => set({ default_return_days: r ? Math.max(settings.return_window_days, days) : 0 })} />
          <WarrantyPicker value={f.default_warranty_days} onChange={(default_warranty_days) => set({ default_warranty_days })} />
          <p className="font-semibold">{tx("কীভাবে পাঠাবেন", "How you ship")}</p>
          <OptionGrid value={f.default_fulfillment} onChange={(default_fulfillment) => set({ default_fulfillment })} options={fulfilOpts.map((x) => ({ value: x, title: lang === "bn" ? fulfillmentLabel[x].seller_bn : fulfillmentLabel[x].seller_en }))} />
          <Toggle checked={f.allows_store_pickup} onChange={(allows_store_pickup) => set({ allows_store_pickup })} label={tx("🏪 কাস্টমার দোকান থেকে নিজে নিতে পারবে", "🏪 Customers may collect from the shop")} />
        </Card>
      </section>

      <Button variant="ok" size="xl" full disabled={!changed || !f.shop_name_bn.trim()} onClick={save} className="sticky bottom-24 z-20 shadow-lg">💾 {tx("সেভ করুন", "Save")}</Button>

      <section className="space-y-3">
        <SectionTitle>🔔 {tx("নোটিফিকেশন", "Notifications")}</SectionTitle>
        <Card className="space-y-1 p-4">
          <Toggle checked={notif.sound} onChange={(sound) => setNotif({ ...notif, sound })} label={tx("🔊 নতুন অর্ডারে শব্দ", "🔊 Sound for new orders")} />
          <Toggle checked={notif.sms} onChange={(sms) => setNotif({ ...notif, sms })} label={tx("📩 নতুন অর্ডারে SMS", "📩 SMS for new orders")} />
          <Toggle checked={notif.smsRequests} onChange={(smsRequests) => setNotif({ ...notif, smsRequests })} label={tx("📩 নতুন রিকোয়েস্টে SMS (দিনে সর্বোচ্চ ৫টা)", "📩 SMS for new requests (max 5/day)")} />
          <Toggle checked={notif.smsMessages} onChange={(smsMessages) => setNotif({ ...notif, smsMessages })} label={tx("📩 ৩০ মিনিটে না দেখা মেসেজে SMS", "📩 SMS for messages unread 30 min")} />
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle>💳 {tx("পেআউট পদ্ধতি", "Payout methods")}</SectionTitle>
        <PayoutMethods vendor={vendor} />
      </section>

      <Link href="/seller/verify" className="block">
        <Card className="flex items-center justify-between p-4">
          <span className="font-semibold">🪪 {tx("যাচাইয়ের কাগজ", "Verification documents")}</span>
          <span className="font-bold text-brand">{d(vp.done)}/{d(vp.total)} ›</span>
        </Card>
      </Link>
    </SellerPage>
  );
}
