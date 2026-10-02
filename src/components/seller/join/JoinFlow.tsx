"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { createVendor, switchVendor, uid } from "@/lib/db/actions";
import { makes, markets, topCategories } from "@/lib/db/queries";
import { iso } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { normalizePhone } from "@/lib/format";
import { vendorTypeLabel } from "@/lib/labels";
import type { MediaItem, VendorType } from "@/lib/types";
import { AudioGuide, SpeakButton } from "../../layout/AudioGuide";
import { useT } from "../../providers/LangProvider";
import { HelpCall, MakeLogo, toast } from "../../shared/Misc";
import { CategoryIcon } from "../../ui/CategoryIcon";
import { Button, ButtonLink, Container, Field, Input, Notice, Toggle } from "../../ui/primitives";
import { agreementPoints } from "../agreement";
import { OptionGrid } from "../Choices";
import { VoiceInput } from "../Dictate";
import { GpsButton } from "../shop/GpsButton";
import { useLocalDraft } from "../utils";

interface Draft {
  step: number;
  phone: string;
  otpSent: boolean;
  verified: boolean;
  byAgent: boolean;
  shopBn: string;
  shopEn: string;
  types: VendorType[];
  market: string;
  address: string;
  lat: number;
  lng: number;
  makes: string[];
  cats: string[];
  photos: MediaItem[];
  agreed: number[];
}

const DEMO_OTP = "1234";
const toggleIn = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

/** 8-step onboarding, one screen each, resumable (file 02 §3). */
export function JoinFlow() {
  const { tx, d, L, lang } = useT();
  const customerPhone = useDb((s) => s.session.customerPhone);
  const vendors = useDb((s) => s.vendors);
  const init: Draft = {
    step: 1, phone: customerPhone ? customerPhone.replace(/^\+88/, "") : "", otpSent: false, verified: false, byAgent: false, shopBn: "", shopEn: "", types: [],
    market: "dholaikhal", address: "", lat: 23.7104, lng: 90.4074, makes: [], cats: [], photos: [], agreed: [],
  };
  const [f, setF, clear] = useLocalDraft<Draft>("gaarihub:seller-join", init);
  const [otp, setOtp] = useState("");
  const [doneId, setDoneId] = useState<string | null>(null);
  const set = (p: Partial<Draft>) => setF((x) => ({ ...x, ...p }));
  const phone = normalizePhone(f.phone);
  const existing = phone ? vendors.find((v) => v.owner_phone === phone) : null;
  const points = agreementPoints();
  const total = 8;
  const step = doneId ? 8 : f.step;

  const finish = () => {
    const market = markets.find((m) => m.id === f.market);
    const v = createVendor({
      shop_name: f.shopEn.trim() || f.shopBn.trim(), shop_name_bn: f.shopBn.trim(), owner_phone: phone!, market_area: f.market, vendor_types: f.types,
      address: f.address.trim(), district: f.market === "chattogram" ? "চট্টগ্রাম" : "ঢাকা", lat: f.lat, lng: f.lng, specialty_makes: f.makes, specialty_categories: f.cats,
      onboarded_by: f.byAgent ? "st-field1" : null, owner_name: f.shopBn.trim(),
      verifications: (["nid_front", "nid_back", "selfie", "trade_license", "shop_photo", "visit_report"] as const).map((doc_type) => {
        const photo = doc_type === "shop_photo" ? f.photos[0] : undefined;
        return { id: uid(), doc_type, file_url: photo?.url ?? null, status: photo ? ("submitted" as const) : ("missing" as const), notes: null, submitted_at: photo ? iso() : null };
      }),
      description_bn: market ? `${market.bn} এর দোকান` : null,
    });
    clear();
    setDoneId(v.id);
  };

  const guides: Record<number, [string, string]> = {
    1: ["আপনার মোবাইল নম্বর দিন। একটা কোড যাবে, সেটা লিখুন।", "Enter your mobile number. Type the code we send."],
    2: ["দোকানের নাম লিখুন, বা মাইক চেপে বলুন।", "Type your shop name or tap the mic and say it."],
    3: ["কী কী বিক্রি করেন, সবগুলোতে টিক দিন।", "Tick everything you sell."],
    4: ["কোন বাজারে দোকান বাছুন। দোকানে থাকলে নীল বাটন চাপুন।", "Pick your market. If you're at the shop, tap the blue button."],
    5: ["কোন গাড়ির আর কী ধরনের পার্টস বেশি রাখেন, টিক দিন। এতে মিলে যাওয়া কাস্টমার পাবেন।", "Tick the car brands and part types you stock most. This brings matching customers."],
    6: ["দোকানের সামনের ছবি সাইনবোর্ডসহ, আর ভেতরের একটা ছবি দিন।", "Take a photo of the shop front with the signboard and one inside."],
    7: ["প্রতিটা নিয়ম শুনুন বা পড়ুন। সব ঠিক থাকলে রাজি চাপুন।", "Listen to or read each rule. Tap Agree when ready."],
    8: ["অভিনন্দন! এখন প্রথম পণ্য যোগ করুন।", "Congratulations! Now add your first product."],
  };
  const titles: Record<number, [string, string]> = {
    1: ["📱 ফোন নম্বর", "📱 Phone number"], 2: ["🏪 দোকানের নাম", "🏪 Shop name"], 3: ["📦 কী বিক্রি করেন?", "📦 What do you sell?"], 4: ["📍 কোথায় দোকান?", "📍 Where's the shop?"],
    5: ["🚗 কোন গাড়ির পার্টস বেশি?", "🚗 Which cars mostly?"], 6: ["📷 দোকানের ছবি", "📷 Shop photos"], 7: ["🤝 চুক্তি", "🤝 Agreement"], 8: ["🎉 শেষ!", "🎉 Done!"],
  };
  const canNext: Record<number, boolean> = {
    1: f.verified && !!phone && !existing, 2: f.shopBn.trim().length >= 2, 3: f.types.length > 0, 4: !!f.market, 5: true, 6: true, 7: f.agreed.length === points.length,
  };

  return (
    <Container className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-muted">
          <span>{tx("ধাপ", "Step")} {d(step)}/{d(total)}</span>
          <span>💾 {tx("পরে এসে বাকিটা করা যাবে", "You can finish later")}</span>
        </div>
        <div className="mb-3 flex gap-1">{Array.from({ length: total }, (_, i) => <span key={i} className={clsx("h-1.5 flex-1 rounded-full", i < step ? "bg-seller" : "bg-line")} />)}</div>
        <h1 className="text-2xl font-bold">{tx(...titles[step])}</h1>
        <AudioGuide text={tx(...guides[step])} className="mt-2" />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <Field label={tx("মোবাইল নম্বর", "Mobile number")} error={f.phone && !phone ? tx("সঠিক নম্বর দিন", "Enter a valid number") : undefined}>
            <Input inputMode="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value, otpSent: false, verified: false })} placeholder="01XXXXXXXXX" className="text-xl" />
          </Field>
          {customerPhone && <Notice>{tx("আপনার কাস্টমার অ্যাকাউন্টেই বিক্রেতা ভূমিকা যোগ হবে।", "We'll add the seller role to your customer account.")}</Notice>}
          {existing && (
            <Notice tone="wait">
              {tx(`এই নম্বরে "${existing.shop_name_bn}" দোকান আছে।`, `"${existing.shop_name}" already uses this number.`)}{" "}
              <Link href="/seller" onClick={() => switchVendor(existing.id)} className="font-bold underline">{tx("সেই দোকানে ঢুকুন", "Open that shop")}</Link>
            </Notice>
          )}
          {!f.otpSent ? (
            <Button variant="brand" size="xl" full disabled={!phone || !!existing} onClick={() => { set({ otpSent: true }); toast(tx(`ডেমো কোড: ${DEMO_OTP}`, `Demo code: ${DEMO_OTP}`), "info"); }}>📩 {tx("কোড পাঠান", "Send code")}</Button>
          ) : f.verified ? (
            <Notice tone="ok">✅ {tx("নম্বর যাচাই হয়েছে", "Number verified")}</Notice>
          ) : (
            <div className="space-y-3">
              <Input inputMode="numeric" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="min-h-16 text-center font-mono text-3xl tracking-[0.5em]" aria-label="OTP" />
              <p className="text-center text-sm text-muted">{tx(`ডেমো: কোড ${d(DEMO_OTP)}`, `Demo: code ${DEMO_OTP}`)}</p>
              <Button variant="ok" size="xl" full disabled={otp.length !== 4} onClick={() => (otp === DEMO_OTP ? set({ verified: true }) : toast(tx("কোড মেলেনি", "Wrong code"), "bad"))}>✅ {tx("যাচাই করুন", "Verify")}</Button>
            </div>
          )}
          <Toggle checked={f.byAgent} onChange={(byAgent) => set({ byAgent })} label={tx("🧑‍🔧 মাঠকর্মী পাশে বসে সাহায্য করছে", "🧑‍🔧 A field agent is helping me")} />
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <Field label={tx("দোকানের নাম (বাংলায়)", "Shop name (Bangla)")}><VoiceInput value={f.shopBn} onChange={(shopBn) => set({ shopBn })} placeholder={tx("যেমন: রহমান মোটরস", "e.g. Rahman Motors")} className="text-xl" /></Field>
          <Field label={tx("ইংরেজিতে (ঐচ্ছিক)", "In English (optional)")}><VoiceInput value={f.shopEn} onChange={(shopEn) => set({ shopEn })} /></Field>
        </div>
      )}
      {step === 3 && (
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(vendorTypeLabel) as VendorType[]).map((t) => {
            const on = f.types.includes(t);
            const soon = t === "car_dealer" || t === "garage";
            return (
              <button key={t} type="button" onClick={() => set({ types: toggleIn(f.types, t) })} className={clsx("flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 text-center font-bold", on ? "border-ok bg-ok-soft" : "border-line bg-card")}>
                <span className="text-3xl">{vendorTypeLabel[t].icon}</span>
                {L(vendorTypeLabel[t])}
                {soon && <span className="text-xs font-semibold text-muted">{tx("ফেজ ২", "Phase 2")}</span>}
                {on && <span className="text-ok">✓</span>}
              </button>
            );
          })}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <OptionGrid value={f.market} onChange={(market) => set({ market })} options={markets.map((m) => ({ value: m.id, icon: "📍", title: L(m) }))} />
          <GpsButton lat={f.lat} lng={f.lng} onChange={(lat, lng) => set({ lat, lng })} />
          <Field label={tx("ঠিকানা (বলুন বা লিখুন)", "Address (say or type)")}><VoiceInput value={f.address} onChange={(address) => set({ address })} placeholder={tx("যেমন: ১৪ ধোলাইখাল রোড", "e.g. 14 Dholaikhal Road")} /></Field>
        </div>
      )}
      {step === 5 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {makes.map((m) => (
              <button key={m.id} type="button" onClick={() => set({ makes: toggleIn(f.makes, m.id) })} className={clsx("flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2", f.makes.includes(m.id) ? "border-ok bg-ok-soft" : "border-line bg-card")}>
                <MakeLogo make={m} />
                <span className="text-sm font-semibold">{lang === "bn" ? m.name_bn : m.name}</span>
              </button>
            ))}
          </div>
          <p className="font-semibold">{tx("প্রধান ধরন", "Main categories")}</p>
          <div className="grid grid-cols-3 gap-2">
            {topCategories().map((c) => (
              <button key={c.id} type="button" onClick={() => set({ cats: toggleIn(f.cats, c.id) })} className={clsx("flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-1 text-center", f.cats.includes(c.id) ? "border-ok bg-ok-soft" : "border-line bg-card")}>
                <CategoryIcon icon={c.icon} className="size-6" />
                <span className="text-xs font-semibold leading-tight">{lang === "bn" ? c.name_bn : c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 6 && (
        <div className="space-y-3">
          <p>🪧 {tx("১. সামনে থেকে, সাইনবোর্ডসহ", "1. From the front, with the signboard")}<br />🏬 {tx("২. দোকানের ভেতরে একটা", "2. One inside the shop")}</p>
          <PhotoUploader value={f.photos} onChange={(photos) => set({ photos })} max={2} />
          {f.photos.length < 2 && <p className="text-sm text-muted">{tx("এখন না পারলে পরে দিতে পারবেন।", "You can add these later.")}</p>}
        </div>
      )}
      {step === 7 && (
        <div className="space-y-2">
          {points.map((p, i) => {
            const ok = f.agreed.includes(i);
            return (
              <div key={i} className={clsx("rounded-2xl border-2 p-3", ok ? "border-ok bg-ok-soft" : "border-line bg-card")}>
                <p className="flex gap-2"><span className="text-xl">{p.icon}</span><span className="flex-1">{tx(p.bn, p.en)}</span></p>
                <div className="mt-2 flex gap-2">
                  <SpeakButton text={tx(p.bn, p.en)} />
                  <Button variant={ok ? "ok" : "outline"} size="sm" className="min-h-10" onClick={() => set({ agreed: ok ? f.agreed.filter((x) => x !== i) : [...f.agreed, i] })}>
                    {ok ? `✓ ${tx("রাজি", "Agreed")}` : tx("রাজি", "Agree")}
                  </Button>
                </div>
              </div>
            );
          })}
          <Button variant="ghost" full onClick={() => set({ agreed: points.map((_, i) => i) })}>✓ {tx("সবগুলোতে রাজি", "Agree to all")}</Button>
          <Link href="/seller/help#rules" className="block text-center text-sm font-semibold text-brand underline">{tx("পূর্ণ চুক্তি পড়ুন", "Read the full agreement")}</Link>
        </div>
      )}
      {step === 8 && doneId && (
        <div className="space-y-4 text-center">
          <p className="text-6xl">🎉</p>
          <p className="text-xl font-bold">{tx("আপনার দোকান খোলা হয়েছে!", "Your shop is open!")}</p>
          <Notice>{tx("পণ্য প্রকাশ করতে NID যাচাই দিন। ততক্ষণ পণ্য ড্রাফট হিসেবে থাকবে।", "Verify your NID to publish. Until then products stay as drafts.")}</Notice>
          <ButtonLink href="/seller/add/camera" variant="brand" size="xl" full>📷 {tx("এখন প্রথম পণ্য যোগ করুন", "Add your first product now")}</ButtonLink>
          <ButtonLink href="/seller/verify" variant="outline" size="lg" full>🪪 {tx("যাচাই করুন", "Verify now")}</ButtonLink>
          <ButtonLink href="/seller" variant="ghost" size="lg" full>{tx("হোমে যান", "Go home")}</ButtonLink>
        </div>
      )}

      {step < 8 && (
        <div className="flex gap-3">
          {step > 1 && <Button variant="outline" size="lg" className="flex-1" onClick={() => set({ step: step - 1 })}>← {tx("পেছনে", "Back")}</Button>}
          {step === 7 ? (
            <Button variant="ok" size="xl" className="flex-[2]" disabled={!canNext[7]} onClick={finish}>🤝 {tx("রাজি, দোকান খুলুন", "Agree, open shop")}</Button>
          ) : (
            <Button variant="brand" size="xl" className="flex-[2]" disabled={!canNext[step]} onClick={() => set({ step: step + 1 })}>
              {(step === 5 && !f.makes.length && !f.cats.length) || (step === 6 && !f.photos.length) ? tx("পরে দেবো →", "Later →") : tx("পরের ধাপ →", "Next →")}
            </Button>
          )}
        </div>
      )}
      <HelpCall text={tx("আটকে গেলে কল করুন, আমরা করে দেবো", "Stuck? Call us and we'll do it with you")} />
    </Container>
  );
}
