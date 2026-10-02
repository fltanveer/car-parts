"use client";

import { ChevronDown, MessageCircle, Phone, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SpeakButton } from "@/components/layout/AudioGuide";
import { useT } from "@/components/providers/LangProvider";
import { agreementPoints } from "@/components/seller/agreement";
import { SellerGate, useVendor } from "@/components/seller/Gate";
import { SellerPage } from "@/components/seller/SellerPage";
import { toast } from "@/components/shared/Misc";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Card, Notice, SectionTitle } from "@/components/ui/primitives";
import { openThread } from "@/lib/db/actions";
import { requestFieldAgent } from "@/lib/db/actions-seller";
import { telLink } from "@/lib/links";
import { prohibitedRules } from "@/lib/mock/taxonomy";
import { settings } from "@/lib/mock/settings";

const VIDEOS = [
  { icon: "📷", bn: "প্রথম পণ্য যোগ", en: "Add your first product", sec: 55, body_bn: "নিচের ➕ চাপুন, ছবি তুলুন, ধাপে ধাপে বাছাই করুন, দাম দিন, পোস্ট করুন।", body_en: "Tap ➕, take photos, choose step by step, set a price, post." },
  { icon: "🙋", bn: "দাম দেওয়া", en: "Quoting on requests", sec: 45, body_bn: "দাম চাই ট্যাবে কার্ড খুলুন, আছে হলে সবুজ বাটন, ছবি আর দাম দিন।", body_en: "Open a card in Requests, tap the green button, add photo and price." },
  { icon: "📦", bn: "অর্ডার পাঠানো", en: "Shipping an order", sec: 60, body_bn: "গ্রহণ করুন, প্যাক করে ছবি দিন, প্যাকেটে কোড লিখুন, রাইডারকে দিন।", body_en: "Accept, pack and photograph, write the code on the parcel, hand to rider." },
  { icon: "💸", bn: "টাকা তোলা", en: "Withdrawing money", sec: 30, body_bn: "টাকা পাতায় সবুজ কার্ডে টাকা তুলুন চাপুন।", body_en: "On the Money page tap Withdraw on the green card." },
  { icon: "💡", bn: "ভালো ছবি তোলার কৌশল", en: "Taking good photos", sec: 40, body_bn: "আলোতে তুলুন, পুরো জিনিস ফ্রেমে আনুন, পার্ট নম্বরের কাছ থেকে ছবি দিন।", body_en: "Use good light, fit the whole item, add a close-up of the part number." },
];

const FAQ = [
  { bn: "কমিশন কত?", en: "What's the commission?", a_bn: `প্রতিটা বিক্রিতে ${settings.default_commission_percent}%। এখন শুরুর অফারে ${settings.promo_commission_percent}%।`, a_en: `${settings.default_commission_percent}% per sale; now ${settings.promo_commission_percent}% as a launch offer.` },
  { bn: "টাকা কবে পাবো?", en: "When do I get paid?", a_bn: `পণ্য পৌঁছানোর ${settings.return_window_days} দিন পর ওয়ালেটে আসে, প্রতি রবিবার পেআউট।`, a_en: `${settings.return_window_days} days after delivery it reaches your wallet; payouts every Sunday.` },
  { bn: "অর্ডার বাতিল করলে কী হবে?", en: "What if I cancel an order?", a_bn: "স্কোর কমবে। স্টক না থাকলে আগেই স্টক ০ করুন।", a_en: "Your score drops. Set stock to 0 early if you're out." },
  { bn: "কাস্টমারের নম্বর পাবো?", en: "Do I get the customer's number?", a_bn: "না। শুধু আপনি নিজে কুরিয়ারে পাঠালে গ্রহণের পর ঠিকানা দেখাবে। কথা অ্যাপের মেসেজে।", a_en: "No. The address shows only for self-shipped orders after accepting. Talk via in-app messages." },
  { bn: "পণ্য অনুমোদন কতক্ষণে?", en: "How long is product review?", a_bn: "সাধারণত ৪ ঘণ্টা। স্তর ২ বা বেশি হলে সাথে সাথে চালু।", a_en: "Usually 4 hours. Level 2+ shops go live instantly." },
];

function Help() {
  const { tx, d, lang } = useT();
  const router = useRouter();
  const v = useVendor()!;
  const [video, setVideo] = useState<(typeof VIDEOS)[number] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const agent = useStateAgent(v.id);

  return (
    <SellerPage
      title={tx("🆘 সাহায্য", "🆘 Help")}
      guide={tx("ছোট ভিডিও দেখুন, প্রশ্নোত্তর শুনুন, বা সরাসরি কল করুন। মাঠকর্মী দোকানে এসে শিখিয়ে দেবে।", "Watch short videos, listen to FAQs, or call us. A field agent can come to your shop.")}
    >
      <div className="grid grid-cols-2 gap-3">
        <a href={telLink()} className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl bg-ok p-3 text-center font-bold text-white">
          <Phone className="size-7" /> {tx("সাপোর্টে কল", "Call support")}
          <span className="text-xs font-normal">{lang === "bn" ? settings.hotline_display : settings.hotline}</span>
        </a>
        <button type="button" onClick={() => router.push(`/seller/messages/${openThread({ type: "vendor_support", vendorId: v.id })}`)} className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl bg-brand p-3 font-bold text-white">
          <MessageCircle className="size-7" /> {tx("সাপোর্টে চ্যাট", "Chat with support")}
        </button>
      </div>
      <Button variant="outline" size="xl" full onClick={agent.ask} disabled={agent.asked}>
        🧑‍🔧 {agent.asked ? tx("অনুরোধ পাঠানো হয়েছে", "Request sent") : tx("মাঠকর্মী ডাকুন", "Call a field agent")}
      </Button>
      <p className="-mt-3 text-center text-sm text-muted">{tx("দোকানে এসে শিখিয়ে দেবে, ছবি তুলে পণ্য তুলে দেবে।", "They'll teach you and upload products with photos.")}</p>

      <section>
        <SectionTitle>🎬 {tx("ছোট ভিডিও", "Short videos")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {VIDEOS.map((x) => (
            <button key={x.en} type="button" onClick={() => setVideo(x)} className="flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-line bg-card p-3 text-center">
              <span className="relative text-3xl">{x.icon}<PlayCircle className="absolute -bottom-1 -right-3 size-5 text-brand" /></span>
              <span className="font-bold leading-tight">{tx(x.bn, x.en)}</span>
              <span className="text-xs text-muted">{d(x.sec)} {tx("সেকেন্ড", "sec")}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>❓ {tx("প্রশ্নোত্তর", "FAQ")}</SectionTitle>
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <Card key={f.en}>
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex min-h-14 w-full items-center justify-between gap-2 px-4 text-left font-semibold">
                {tx(f.bn, f.en)} <ChevronDown className={open === i ? "size-5 rotate-180" : "size-5"} />
              </button>
              {open === i && (
                <div className="flex items-start gap-2 px-4 pb-4">
                  <p className="flex-1">{tx(f.a_bn, f.a_en)}</p>
                  <SpeakButton text={tx(f.a_bn, f.a_en)} />
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section id="rules" className="scroll-mt-20">
        <SectionTitle>📜 {tx("নিয়মকানুন", "Rules")}</SectionTitle>
        <Card className="space-y-2 p-4">
          <p className="font-bold">{tx("চুক্তির মূল কথা", "Agreement key points")}</p>
          {agreementPoints().map((p) => (
            <div key={p.en} className="flex items-start gap-2">
              <span>{p.icon}</span>
              <p className="flex-1 text-sm">{tx(p.bn, p.en)}</p>
              <SpeakButton text={tx(p.bn, p.en)} label="" className="px-2" />
            </div>
          ))}
        </Card>
        <Card className="mt-3 space-y-2 p-4">
          <p className="font-bold">⛔ {tx("নিষিদ্ধ বা সীমিত জিনিস", "Prohibited or restricted")}</p>
          {prohibitedRules.map((r) => (
            <p key={r.en} className="flex justify-between gap-2 text-sm"><span>{tx(r.bn, r.en)}</span><b className="shrink-0 text-bad">{tx(r.rule_bn, r.rule_en)}</b></p>
          ))}
        </Card>
        <Notice className="mt-3">💰 {tx(`আপনার কমিশন এখন ${d(v.commission_percent)}%। স্বাভাবিক হার ${d(settings.default_commission_percent)}%।`, `Your commission is ${v.commission_percent}%. Standard rate ${settings.default_commission_percent}%.`)}</Notice>
      </section>

      <Sheet open={!!video} onClose={() => setVideo(null)} title={video ? tx(video.bn, video.en) : ""}>
        {video && (
          <div className="space-y-3 pb-2">
            <div className="grid aspect-video place-items-center rounded-2xl bg-ink text-6xl text-white">{video.icon}</div>
            <Notice tone="wait">🎬 {tx("ভিডিও শীঘ্রই আসছে। এখন শুনে নিন:", "Video coming soon. Listen for now:")}</Notice>
            <p className="text-lg">{tx(video.body_bn, video.body_en)}</p>
            <SpeakButton text={tx(video.body_bn, video.body_en)} />
          </div>
        )}
      </Sheet>
    </SellerPage>
  );
}

function useStateAgent(vendorId: string) {
  const { tx } = useT();
  const [asked, setAsked] = useState(false);
  return {
    asked,
    ask: () => {
      requestFieldAgent(vendorId, "শেখানো / পণ্য তোলা");
      setAsked(true);
      toast(tx("মাঠকর্মী শীঘ্রই ফোন করবে", "A field agent will call soon"));
    },
  };
}

export default function Page() {
  return (
    <SellerGate>
      <Help />
    </SellerGate>
  );
}
