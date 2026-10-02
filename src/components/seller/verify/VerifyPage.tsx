"use client";

import clsx from "clsx";
import { useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { requestFieldAgent, submitVerificationDoc } from "@/lib/db/actions-seller";
import { useDb } from "@/lib/db/store";
import { verificationPerks } from "@/lib/rules";
import type { MediaItem, Vendor, VerificationDoc } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { toast } from "../../shared/Misc";
import { MediaImage } from "../../ui/MediaImage";
import { Button, Card, Notice, SectionTitle, StatusPill } from "../../ui/primitives";
import { SellerPage } from "../SellerPage";
import { verificationProgress } from "../utils";
import { PayoutMethods } from "./PayoutMethods";

const DOCS: { type: VerificationDoc; icon: string; bn: string; en: string; level: number }[] = [
  { type: "nid_front", icon: "🪪", bn: "NID সামনের দিক", en: "NID front", level: 1 },
  { type: "nid_back", icon: "🪪", bn: "NID পেছনের দিক", en: "NID back", level: 1 },
  { type: "selfie", icon: "🤳", bn: "সেলফি (মুখ পরিষ্কার)", en: "Selfie (clear face)", level: 1 },
  { type: "trade_license", icon: "📄", bn: "ট্রেড লাইসেন্স", en: "Trade licence", level: 2 },
  { type: "shop_photo", icon: "🏪", bn: "দোকানের ছবি (সাইনবোর্ডসহ)", en: "Shop photo (with signboard)", level: 2 },
];
const LEVEL_ICON = ["🌱", "🪪", "✅", "🏅"];

function DocRow({ vendor, doc }: { vendor: Vendor; doc: (typeof DOCS)[number] }) {
  const { tx } = useT();
  const v = vendor.verifications.find((x) => x.doc_type === doc.type);
  const [items, setItems] = useState<MediaItem[]>([]);
  const status = v?.status ?? "missing";
  const tone = status === "approved" ? "ok" : status === "submitted" ? "wait" : status === "rejected" ? "bad" : "info";
  const label = { approved: tx("অনুমোদিত", "Approved"), submitted: tx("যাচাই হচ্ছে", "In review"), rejected: tx("বাতিল", "Rejected"), missing: tx("দেওয়া হয়নি", "Missing") }[status];
  const canUpload = status === "missing" || status === "rejected";
  return (
    <Card className="space-y-3 p-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{doc.icon}</span>
        <span className="flex-1 font-semibold">{tx(doc.bn, doc.en)}</span>
        <StatusPill tone={tone}>{label}</StatusPill>
      </div>
      {v?.notes && status === "rejected" && <Notice tone="bad">{v.notes}</Notice>}
      {v?.file_url && !canUpload && <MediaImage src={v.file_url} alt={doc.en} className="h-24 w-36 rounded-xl" />}
      {canUpload && (
        <>
          <PhotoUploader value={items} onChange={setItems} max={1} />
          <Button variant="ok" full disabled={!items.length} onClick={() => { submitVerificationDoc(vendor.id, doc.type, items[0].url); setItems([]); toast(tx("জমা হয়েছে, টিম যাচাই করবে", "Submitted for review")); }}>
            📤 {tx("জমা দিন", "Submit")}
          </Button>
        </>
      )}
    </Card>
  );
}

export function VerifyPage({ vendor }: { vendor: Vendor }) {
  const { tx, d, L } = useT();
  const vp = verificationProgress(vendor);
  const visitAsked = useDb((s) => s.callRequests.some((c) => c.target_id === vendor.id && c.status === "pending" && c.context.includes("পরিদর্শন")));
  return (
    <SellerPage
      title={tx("✅ যাচাই", "✅ Verification")}
      subtitle={tx(`অগ্রগতি: ${d(vp.done)}/${d(vp.total)}`, `Progress: ${vp.done}/${vp.total}`)}
      back="/seller"
      guide={tx("যত বেশি যাচাই, তত বেশি বিক্রি। NID আর সেলফি দিলে স্তর ১, ট্রেড লাইসেন্স দিলে স্তর ২, টিম দোকানে এলে স্তর ৩।", "More verification, more sales. NID and selfie give level 1, trade licence level 2, a team visit level 3.")}
    >
      <div className="grid grid-cols-2 gap-2">
        {verificationPerks.map((p) => (
          <div key={p.level} className={clsx("rounded-2xl border-2 p-3", p.level === vendor.verification_level ? "border-ok bg-ok-soft" : p.level < vendor.verification_level ? "border-line bg-card opacity-70" : "border-line bg-card")}>
            <p className="text-2xl">{LEVEL_ICON[p.level]}</p>
            <p className="font-bold">{tx("স্তর", "Level")} {d(p.level)} {p.level === vendor.verification_level && `· ${tx("আপনি", "You")}`}</p>
            <p className="text-sm">{L(p)}</p>
          </div>
        ))}
      </div>

      <section className="space-y-2">
        <SectionTitle>{tx("পরিচয় (স্তর ১)", "Identity (level 1)")}</SectionTitle>
        {DOCS.filter((x) => x.level === 1).map((doc) => <DocRow key={doc.type} vendor={vendor} doc={doc} />)}
      </section>
      <section className="space-y-2">
        <SectionTitle>{tx("দোকান (স্তর ২)", "Shop (level 2)")}</SectionTitle>
        {DOCS.filter((x) => x.level === 2).map((doc) => <DocRow key={doc.type} vendor={vendor} doc={doc} />)}
        <p className="text-sm text-muted">📞 {tx("কাগজ পেলে টিম আপনাকে একবার ফোন করবে।", "The team will call you once after receiving the papers.")}</p>
      </section>
      <section className="space-y-2">
        <SectionTitle>{tx("সরেজমিনে (স্তর ৩)", "Field visit (level 3)")}</SectionTitle>
        <Card className="space-y-3 p-4">
          <p>🏪 {tx("টিমের লোক দোকানে এসে দেখবে। এতে 🏅 বিশ্বস্ত বিক্রেতা ব্যাজ, দ্রুত পেআউট আর সার্চে অগ্রাধিকার পাবেন।", "A team member visits your shop. You get the 🏅 trusted badge, faster payouts and a search boost.")}</p>
          {vendor.verification_level >= 3 ? (
            <Notice tone="ok">🏅 {tx("পরিদর্শন সম্পন্ন", "Visit done")}</Notice>
          ) : visitAsked ? (
            <Notice tone="wait">⏳ {tx("অনুরোধ পাঠানো হয়েছে, টিম ফোন করে সময় ঠিক করবে।", "Requested. The team will call to fix a time.")}</Notice>
          ) : (
            <Button variant="brand" size="lg" full onClick={() => { requestFieldAgent(vendor.id, "দোকান পরিদর্শন (স্তর ৩)"); toast(tx("অনুরোধ পাঠানো হয়েছে", "Request sent")); }}>🙋 {tx("পরিদর্শনের অনুরোধ", "Request a visit")}</Button>
          )}
        </Card>
      </section>
      <section className="space-y-2">
        <SectionTitle>💳 {tx("টাকা কোথায় নেবেন", "Where to receive money")}</SectionTitle>
        <PayoutMethods vendor={vendor} />
      </section>
    </SellerPage>
  );
}
