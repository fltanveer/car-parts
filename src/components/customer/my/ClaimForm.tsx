"use client";

import clsx from "clsx";
import { Send } from "lucide-react";
import { useState } from "react";
import { fileClaim } from "@/lib/db/actions";
import { claimTypeLabel } from "@/lib/labels";
import { settings } from "@/lib/mock/settings";
import { getClaimOptions } from "@/lib/rules";
import type { ClaimType, MediaItem, VendorOrder, VoiceNote } from "@/lib/types";
import { PhotoUploader } from "../../media/PhotoUploader";
import { VoicePlayer } from "../../media/VoicePlayer";
import { VoiceRecorder } from "../../media/VoiceRecorder";
import { SpeakButton } from "../../layout/AudioGuide";
import { toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { MediaImage } from "../../ui/MediaImage";
import { Button, Notice, SectionTitle, Textarea } from "../../ui/primitives";

/** New claim: item → problem type → evidence → who pays + timeline (file 01 §7.2). */
export function ClaimForm({ parcels, now, onDone }: { parcels: VendorOrder[]; now: number; onDone: () => void }) {
  const { tx, L, lang, d } = useT();
  const items = parcels.flatMap((vo) => vo.items.map((it) => ({ vo, it })));
  const [pick, setPick] = useState<string | null>(items.length === 1 ? items[0].it.id : null);
  const [type, setType] = useState<ClaimType | null>(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [voice, setVoice] = useState<VoiceNote[]>([]);
  const [text, setText] = useState("");
  const sel = items.find((x) => x.it.id === pick) ?? null;
  const options = sel ? getClaimOptions(sel.it.snapshot, sel.vo.delivered_at, now) : [];
  const opt = options.find((o) => o.type === type && o.eligible) ?? null;
  const hasPhoto = photos.some((p) => p.kind === "image");
  const days = Math.round(settings.vendor_dispute_response_hours / 24);

  if (!items.length) return <Notice>{tx("জিনিস হাতে পাওয়ার পর এখানে সমস্যা জানাতে পারবেন।", "You can report a problem here once the item is delivered.")}</Notice>;

  const submit = () => {
    if (!sel || !opt) return;
    fileClaim({ vendorOrderId: sel.vo.id, itemId: sel.it.id, type: opt.type, description: text.trim() || null, media: photos, voice, liability: opt.liability });
    toast(tx("সমস্যা জানানো হয়েছে। দোকানকে জানানো হলো।", "Problem reported. The shop has been told."));
    onDone();
  };

  const liability = opt
    ? { vendor: tx("খরচ দোকানের", "The shop pays"), customer: tx("খরচ আপনার", "You pay the costs"), review: tx("প্রমাণ দেখে গাড়িহাব ঠিক করবে", "GaariHub decides from the evidence") }[opt.liability]
    : "";

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>① {tx("কোন জিনিসে সমস্যা?", "Which item?")}</SectionTitle>
        <div className="space-y-2">
          {items.map(({ it }) => (
            <button
              key={it.id}
              type="button"
              onClick={() => {
                setPick(it.id);
                setType(null);
              }}
              aria-pressed={pick === it.id}
              className={clsx("flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-3 text-left", pick === it.id ? "border-brand bg-brand-soft/40" : "border-line")}
            >
              <MediaImage src={it.snapshot.image} alt={it.snapshot.title} className="size-14 shrink-0 rounded-xl" />
              <span className="font-semibold">{it.snapshot.title}</span>
            </button>
          ))}
        </div>
      </section>

      {sel && (
        <section>
          <SectionTitle>② {tx("কী সমস্যা?", "What's wrong?")}</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((o) => {
              const l = claimTypeLabel[o.type];
              return (
                <button
                  key={o.type}
                  type="button"
                  disabled={!o.eligible}
                  onClick={() => setType(o.type)}
                  aria-pressed={type === o.type}
                  className={clsx(
                    "flex min-h-20 items-start gap-3 rounded-2xl border-2 p-3 text-left",
                    !o.eligible ? "cursor-not-allowed border-line bg-surface opacity-60" : type === o.type ? "border-bad bg-bad-soft" : "border-line bg-card hover:border-ink/30",
                  )}
                >
                  <span className="text-3xl" aria-hidden>
                    {l.icon}
                  </span>
                  <span>
                    <span className="block font-bold">{L(l)}</span>
                    {!o.eligible && <span className="block text-xs text-bad">{lang === "bn" ? o.reason_bn ?? "এখন প্রযোজ্য নয়" : o.reason_en ?? "Not available now"}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          {opt && (
            <div className="mt-3 space-y-2 rounded-2xl border border-line bg-card p-4">
              <p className="font-semibold">📜 {lang === "bn" ? opt.rule_bn : opt.rule_en}</p>
              <p className={clsx("font-bold", opt.liability === "vendor" ? "text-ok" : opt.liability === "customer" ? "text-wait" : "text-ink-2")}>⚖️ {liability}</p>
              <SpeakButton text={`${lang === "bn" ? opt.rule_bn : opt.rule_en} ${liability}`} />
            </div>
          )}
        </section>
      )}

      {opt && (
        <section className="space-y-3">
          <SectionTitle>③ {tx("প্রমাণ দিন", "Add evidence")}</SectionTitle>
          <p className="text-sm font-semibold">📷 {tx("ছবি (অবশ্যই লাগবে), ভিডিও থাকলে দিন", "Photos (required), video if you have it")}</p>
          <PhotoUploader value={photos} onChange={setPhotos} allowVideo max={6} />
          {!hasPhoto && <p className="text-sm text-bad">{tx("কমপক্ষে ১টা ছবি দিন", "Add at least 1 photo")}</p>}
          <p className="pt-2 text-sm font-semibold">🎤 {tx("মুখে বলুন (ঐচ্ছিক)", "Say it (optional)")}</p>
          {voice.map((v) => (
            <VoicePlayer key={v.id} src={v.url} duration={v.duration_sec} />
          ))}
          <VoiceRecorder compact onSaved={(v) => setVoice((x) => [...x, v])} />
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={tx("লিখে বলতে চাইলে (ঐচ্ছিক)", "Or type it (optional)")} className="min-h-20" />
        </section>
      )}

      {opt && (
        <section className="space-y-3">
          <SectionTitle>④ {tx("এরপর কী হবে", "What happens next")}</SectionTitle>
          <ol className="space-y-2 text-sm">
            <li>🏪 {tx(`দোকান ${d(days)} দিনের মধ্যে উত্তর দেবে। না দিলে আমরা নিজে দেখবো।`, `The shop replies within ${days} days. If not, we step in.`)}</li>
            <li>🧑‍⚖️ {tx("উত্তর পছন্দ না হলে যেকোনো সময় 'গাড়িহাবকে জানান' চাপুন।", "Not happy with the reply? Press 'Tell GaariHub' any time.")}</li>
            <li>💸 {tx("সিদ্ধান্ত অনুযায়ী টাকা ফেরত বা জিনিস বদল।", "Refund or replacement as decided.")}</li>
          </ol>
          <Notice tone="ok">🔒 {tx("টাকা নিরাপদ: সমাধান না হওয়া পর্যন্ত দোকান টাকা পাবে না।", "Your money is safe: the shop isn't paid until this is resolved.")}</Notice>
          <Button variant="danger" size="xl" full onClick={submit} disabled={!hasPhoto} className="border-bad bg-bad text-white hover:bg-bad/90">
            <Send className="size-6" aria-hidden /> {tx("সমস্যা জানান", "Report problem")}
          </Button>
        </section>
      )}
    </div>
  );
}
