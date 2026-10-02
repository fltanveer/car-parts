"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { vendorAcceptClaim, vendorDisputeClaim } from "@/lib/db/actions";
import { logActivity, openCustomerThread } from "@/lib/db/actions-seller";
import { listingById, vendorOrderById } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { claimStatusLabel, claimTypeLabel } from "@/lib/labels";
import type { Claim, MediaItem, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { Countdown, NumberPad, toast } from "../../shared/Misc";
import { MediaImage } from "../../ui/MediaImage";
import { Sheet } from "../../ui/Sheet";
import { Button, Card, Notice, StatusPill } from "../../ui/primitives";
import { OptionGrid, ReasonChips } from "../Choices";
import { VoiceTextarea } from "../Dictate";

const DISPUTE = {
  bn: ["ছবির মতোই পাঠিয়েছি", "প্যাকিং ছবি দেখুন", "কাস্টমার ভুল গাড়ি বেছেছে", "লাগানোর পর নষ্ট হয়েছে", "অন্য কারণ"],
  en: ["Sent exactly as pictured", "See the packing photo", "Customer picked the wrong car", "Damaged after fitting", "Other"],
};

/** One claim: customer evidence vs my evidence, and the three answers (file 02 §9). */
export function ClaimCard({ c, vendor }: { c: Claim; vendor: Vendor }) {
  const { tx, taka, L, d, lang } = useT();
  const router = useRouter();
  const vo = useDb((s) => vendorOrderById(s, c.vendor_order_id));
  const item = vo?.items.find((i) => i.id === c.order_item_id) ?? vo?.items[0];
  const listing = useDb((s) => listingById(s, item?.listing_id ?? null));
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [res, setRes] = useState<"refund" | "replace" | "partial_refund">("refund");
  const [amount, setAmount] = useState(0);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const t = claimTypeLabel[c.type];
  const full = item?.line_total ?? vo?.subtotal ?? 0;
  const open = c.status === "vendor_review";

  const impact = c.status === "resolved_refund"
    ? tx(`এই অর্ডারের ${taka(c.refund_amount ?? full)} কাস্টমারকে ফেরত দেওয়া হলো।`, `${taka(c.refund_amount ?? full)} from this order was refunded to the customer.`)
    : c.status === "resolved_replace"
      ? tx("বদলে নতুন পণ্য পাঠাতে হবে। টাকা কাটা হবে না।", "Send a replacement. No money deducted.")
      : c.status === "resolved_rejected"
        ? tx("দাবি বাতিল হয়েছে, আপনার টাকা ঠিক আছে।", "Claim rejected, your money is safe.")
        : tx(`সমাধান না হওয়া পর্যন্ত এই অর্ডারের ${taka(vo?.vendor_payable ?? 0)} আটকে থাকবে।`, `${taka(vo?.vendor_payable ?? 0)} is on hold until this is resolved.`);

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-bold">{t.icon} {L(t)}</p>
        <StatusPill tone={claimStatusLabel[c.status].tone}>{L(claimStatusLabel[c.status])}</StatusPill>
      </div>
      <p className="text-sm text-muted">{c.claim_no} · <span className="font-mono">{vo?.sub_order_no}</span> · {item?.snapshot.title}</p>
      {open && <Countdown to={c.vendor_respond_by} prefix={tx("উত্তর দিন: ", "Reply within: ")} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2 rounded-xl bg-bad-soft/60 p-3">
          <p className="text-sm font-bold text-bad">🙋 {tx("কাস্টমারের প্রমাণ", "Customer's evidence")}</p>
          {c.description && <p className="text-sm">{c.description}</p>}
          <div className="flex flex-wrap gap-1.5">{c.media.map((m) => <MediaImage key={m.id} src={m.url} alt={m.name} className="size-16 rounded-lg" />)}</div>
          {c.voice_notes.length > 0 && <p className="text-xs text-muted">🎤 {tx("ভয়েস আছে, টিম শুনবে", "Voice note, reviewed by team")}</p>}
        </div>
        <div className="space-y-2 rounded-xl bg-ok-soft/60 p-3">
          <p className="text-sm font-bold text-ok">🏪 {tx("আমার প্রমাণ", "My evidence")}</p>
          <div className="flex flex-wrap gap-1.5">
            {(listing?.media ?? []).slice(0, 2).map((m, i) => <MediaImage key={i} src={m.url} alt={tx("লিস্টিং ছবি", "Listing photo")} className="size-16 rounded-lg" />)}
            {vo?.packing_photo && <MediaImage src={vo.packing_photo} alt={tx("প্যাকিং ছবি", "Packing photo")} className="size-16 rounded-lg ring-2 ring-ok" />}
          </div>
          <p className="text-xs">{vo?.packing_photo ? `📦 ${tx("প্যাকিং ছবি আছে", "Packing photo on file")}` : `⚠️ ${tx("প্যাকিং ছবি নেই", "No packing photo")}`}</p>
          {vo?.qc && <p className="text-xs">✔️ QC: {vo.qc.result === "pass" ? tx("পাস", "Pass") : tx("ফেল", "Fail")}{vo.qc.note && ` · ${vo.qc.note}`}</p>}
        </div>
      </div>

      {c.liability === "vendor" && open && <Notice tone="wait">{tx("নিয়ম অনুযায়ী এই ধরনের সমস্যায় দায় সাধারণত দোকানের।", "By the rules, this kind of problem is usually the shop's responsibility.")}</Notice>}
      {c.vendor_response && <p className="rounded-xl bg-surface p-3 text-sm">💬 {tx("আমার উত্তর", "My reply")}: {c.vendor_response}</p>}
      <p className="text-sm font-semibold">💰 {impact}</p>

      {open && (
        <div className="space-y-2">
          <Button variant="ok" size="lg" full onClick={() => { setAmount(Math.round(full / 2)); setAcceptOpen(true); }}>✅ {tx("মেনে নিচ্ছি", "I accept")}</Button>
          <Button variant="danger" size="lg" full onClick={() => setDisputeOpen(true)}>❌ {tx("একমত নই", "I disagree")}</Button>
          <Button variant="outline" size="lg" full onClick={() => router.push(`/seller/messages/${openCustomerThread(vendor.id, c.user_phone, "vendor_order", c.vendor_order_id)}`)}>💬 {tx("কাস্টমারের সাথে কথা বলি", "Talk to the customer")}</Button>
          <p className="text-center text-xs text-muted">{tx("কথা বলার সময়ও সময়সীমা চলতে থাকবে।", "The deadline keeps running while you talk.")}</p>
        </div>
      )}

      <Sheet open={acceptOpen} onClose={() => setAcceptOpen(false)} title={tx("কীভাবে সমাধান করবেন?", "How will you resolve it?")}>
        <div className="space-y-4 pb-2">
          <OptionGrid
            value={res}
            onChange={setRes}
            options={[
              { value: "refund", icon: "💸", title: tx("টাকা ফেরত", "Refund"), sub: taka(full) },
              { value: "replace", icon: "🔁", title: tx("বদলে দেবো", "Replace"), sub: tx("নতুন পণ্য পাঠাবো", "Send a new one") },
              { value: "partial_refund", icon: "➗", title: tx("আংশিক ফেরত", "Partial refund"), sub: tx("পরিমাণ দিন", "Set amount") },
            ]}
          />
          {res === "partial_refund" && <NumberPad value={amount} onChange={(v) => setAmount(Math.min(v, full))} max={full} />}
          <Notice tone="wait">
            {res === "replace" ? tx("কোনো টাকা কাটা হবে না, তবে নতুন পণ্য পাঠাতে হবে।", "No money deducted, but you must send a replacement.") : tx(`আপনার পাওনা থেকে ${taka(res === "refund" ? full : amount)} কাটা হবে।`, `${taka(res === "refund" ? full : amount)} will be deducted from your earnings.`)}
          </Notice>
          <Button variant="ok" size="xl" full disabled={res === "partial_refund" && amount <= 0} onClick={() => { vendorAcceptClaim(c.id, res, res === "replace" ? null : res === "refund" ? full : amount); logActivity(vendor.id, `দাবি ${c.claim_no} মেনে নেওয়া`); setAcceptOpen(false); toast(tx("জানানো হয়েছে ✅", "Done ✅")); }}>
            ✅ {tx("নিশ্চিত করুন", "Confirm")}
          </Button>
        </div>
      </Sheet>

      <Sheet open={disputeOpen} onClose={() => setDisputeOpen(false)} title={tx("কেন একমত নন?", "Why do you disagree?")}>
        <div className="space-y-4 pb-2">
          <ReasonChips reasons={lang === "bn" ? DISPUTE.bn : DISPUTE.en} value={reason} onChange={setReason} />
          <VoiceTextarea value={text} onChange={setText} placeholder={tx("আরও বলুন (ঐচ্ছিক)", "Tell us more (optional)")} />
          <p className="font-semibold">📷 {tx("প্রমাণ ছবি", "Evidence photos")}</p>
          <PhotoUploader value={photos} onChange={setPhotos} max={3} />
          <Notice>{tx("গাড়িহাব দুই পক্ষের প্রমাণ দেখে সিদ্ধান্ত দেবে।", "GaariHub will decide after looking at both sides.")}</Notice>
          <Button variant="danger" size="xl" full disabled={!reason} onClick={() => {
            vendorDisputeClaim(c.id, [reason, text.trim(), photos.length ? tx(`প্রমাণ ছবি ${d(photos.length)}টা`, `${photos.length} evidence photos`) : ""].filter(Boolean).join(" · "));
            logActivity(vendor.id, `দাবি ${c.claim_no}: আপত্তি`);
            setDisputeOpen(false);
            toast(tx("আপত্তি পাঠানো হয়েছে", "Dispute sent"), "info");
          }}>
            📨 {tx("পাঠান", "Send")}
          </Button>
        </div>
      </Sheet>
    </Card>
  );
}
