"use client";

import clsx from "clsx";
import { CheckCircle2, Info, Video } from "lucide-react";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { RequireLogin } from "@/components/auth/RequireLogin";
import { VoicePlayer } from "@/components/media/VoicePlayer";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { VoiceRecorder } from "@/components/media/VoiceRecorder";
import { ClaimProgress } from "@/components/orders/ClaimProgress";
import { ContactUs } from "@/components/orders/ContactUs";
import { useNow } from "@/components/orders/useNow";
import { QualityBadge } from "@/components/part/QualityBadge";
import { useT } from "@/components/providers/LangProvider";
import { Button, ButtonLink, Card, ChoiceCard, Container, Notice, PageHeader, SectionTitle, Textarea } from "@/components/ui/primitives";
import { claimTypeLabel } from "@/lib/i18n";
import { getClaimOptions } from "@/lib/rules";
import { createClaim, useStore } from "@/lib/store";
import type { Claim, ClaimType, MediaItem, VoiceNote } from "@/lib/types";

const ICON: Record<ClaimType, string> = {
  wrong_part_our_fault: "❌",
  damaged_on_arrival: "💥",
  warranty: "🛡️",
  customer_mistake: "🔁",
};

export default function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tx } = useT();
  return (
    <RequireLogin reason={tx("সমস্যা জানাতে লগইন করুন", "Log in to report a problem")}>
      <ClaimForm orderId={id} />
    </RequireLogin>
  );
}

function ClaimForm({ orderId }: { orderId: string }) {
  const { tx, lang, d, date } = useT();
  const now = useNow();
  const order = useStore((s) => s.orders.find((o) => o.id === orderId));
  const allClaims = useStore((s) => s.claims);

  const [itemId, setItemId] = useState<string | null>(null);
  const [type, setType] = useState<ClaimType | null>(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [voice, setVoice] = useState<VoiceNote | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Claim | null>(null);

  const item = order ? (order.items.find((i) => i.id === itemId) ?? (order.items.length === 1 ? order.items[0] : null)) : null;
  const options = useMemo(() => (order && item ? getClaimOptions(order, item, now) : []), [order, item, now]);
  const chosen = options.find((o) => o.type === type && o.eligible) ?? null;
  const openClaims = allClaims.filter((c) => c.order_id === orderId && c.order_item_id === item?.id && c.status !== "closed");

  if (!order)
    return (
      <Container className="max-w-md">
        <Card className="mt-6 p-6 text-center">
          <h1 className="text-xl font-bold">{tx("অর্ডার পাওয়া যায়নি", "Order not found")}</h1>
          <ButtonLink href="/orders" variant="primary" size="lg" full className="mt-4">
            {tx("আমার অর্ডার", "My orders")}
          </ButtonLink>
        </Card>
      </Container>
    );

  const back = (
    <Link href={`/orders/${order.id}`} className="mb-2 inline-block text-sm font-semibold text-muted">
      ← {tx("অর্ডার", "Order")} {d(order.order_no)}
    </Link>
  );

  if (done)
    return (
      <Container className="max-w-md">
        <Card className="mt-4 p-6 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-ok text-white">
            <CheckCircle2 className="size-9" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">{tx("দাবি জমা হয়েছে", "Claim submitted")}</h1>
          <p className="mt-3 text-sm text-muted">{tx("দাবি নম্বর", "Claim number")}</p>
          <p className="text-4xl font-extrabold tracking-wide">{d(done.claim_no)}</p>
          <p className="mt-3 text-sm text-ink-2">
            {tx("আমরা যাচাই করে SMS ও কলে জানাবো। নিজে থেকে পার্ট পাঠাবেন না, আমরা ঠিকানা ও নির্দেশনা দেবো।", "We'll review and let you know by SMS or call. Don't send the part yet; we'll share the address and steps.")}
          </p>
        </Card>
        <Card className="mt-3 p-5">
          <SectionTitle>{tx("এরপর যা হবে", "What happens next")}</SectionTitle>
          <ClaimProgress claim={done} />
        </Card>
        <ButtonLink href={`/orders/${order.id}`} variant="primary" size="lg" full className="mt-4">
          {tx("অর্ডারে ফিরে যান", "Back to order")}
        </ButtonLink>
      </Container>
    );

  if (order.status !== "delivered")
    return (
      <Container className="max-w-md">
        {back}
        <PageHeader title={tx("সমস্যা জানান", "Report a problem")} />
        <Notice tone="warn">
          {tx(
            "পার্ট হাতে পাওয়ার পর সমস্যা জানানো যাবে। ডেলিভারির সময় পার্সেল খুলে দেখে নিন, ভাঙা থাকলে তখনই কুরিয়ারকে দেখান।",
            "You can report a problem after delivery. Open the parcel when it arrives; if it's broken, show the courier right away.",
          )}
        </Notice>
        <div className="mt-4">
          <ContactUs />
        </div>
      </Container>
    );

  const submit = () => {
    if (!item || !chosen) return;
    if (!photos.some((p) => p.kind === "image")) {
      setError(tx("কমপক্ষে ১টা ছবি দিন", "Add at least 1 photo"));
      return;
    }
    const claim = createClaim({
      order_id: order.id,
      order_item_id: item.id,
      type: chosen.type,
      description_text: text.trim() || null,
      photos,
      voice_notes: voice ? [voice] : [],
    });
    setDone(claim);
    window.scrollTo({ top: 0 });
  };

  const anyEligible = options.some((o) => o.eligible);
  const hasVideo = photos.some((p) => p.kind === "video");

  return (
    <Container className="max-w-xl">
      {back}
      <PageHeader title={tx("সমস্যা জানান", "Report a problem")} subtitle={tx(`পৌঁছেছে ${order.delivered_at ? date(order.delivered_at) : ""}`, `Delivered ${order.delivered_at ? date(order.delivered_at) : ""}`)} />

      <div className="space-y-5">
        {order.items.length > 1 && (
          <section>
            <SectionTitle>{tx("কোন পার্টে সমস্যা?", "Which part?")}</SectionTitle>
            <div className="space-y-2">
              {order.items.map((i) => (
                <ChoiceCard
                  key={i.id}
                  selected={item?.id === i.id}
                  onClick={() => {
                    setItemId(i.id);
                    setType(null);
                    setError(null);
                  }}
                  title={i.title_snapshot}
                  subtitle={
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <QualityBadge quality={i.quality_snapshot} lang={lang} />
                      <span>
                        {d(i.qty)} {tx("টি", "pc")}
                      </span>
                    </span>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {item && (
          <section>
            <SectionTitle>{tx("কী সমস্যা?", "What's wrong?")}</SectionTitle>
            {openClaims.length > 0 && (
              <Notice className="mb-3">
                {tx(`এই পার্টে আগেই দাবি আছে (${openClaims.map((c) => d(c.claim_no)).join(", ")})।`, `There's already a claim for this part (${openClaims.map((c) => c.claim_no).join(", ")}).`)}
              </Notice>
            )}
            <div className="space-y-2">
              {options.map((o) => (
                <ChoiceCard
                  key={o.type}
                  selected={type === o.type && o.eligible}
                  disabled={!o.eligible}
                  onClick={() => {
                    setType(o.type);
                    setError(null);
                  }}
                  icon={<span className="text-2xl" aria-hidden>{ICON[o.type]}</span>}
                  title={claimTypeLabel[o.type][lang]}
                  subtitle={!o.eligible ? <span className="font-medium text-danger">{lang === "bn" ? o.reason_bn : o.reason_en}</span> : undefined}
                  className={clsx(!o.eligible && "cursor-not-allowed")}
                />
              ))}
            </div>
            {!anyEligible && (
              <Notice tone="warn" className="mt-3">
                {tx("নিয়ম অনুযায়ী এই পার্টে এখন দাবি করা যাচ্ছে না। তবুও আমাদের সাথে কথা বলুন, দেখি কী করা যায়।", "Under our rules this part can't be claimed now. Still, talk to us and we'll see what we can do.")}
              </Notice>
            )}
          </section>
        )}

        {chosen && (
          <>
            <Notice>
              <span className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <b>{tx("নিয়ম", "Rule")}:</b> {lang === "bn" ? chosen.rule_bn : chosen.rule_en}
                </span>
              </span>
            </Notice>

            <section>
              <SectionTitle>{tx("প্রমাণ দিন", "Evidence")}</SectionTitle>
              <p className="mb-2 font-semibold">
                {tx("ছবি", "Photos")} <span className="text-danger">*</span>{" "}
                <span className="font-normal text-muted">{tx("(কমপক্ষে ১টা, ভিডিওও দিতে পারেন)", "(at least 1; videos welcome)")}</span>
              </p>
              {chosen.type === "damaged_on_arrival" && (
                <Notice tone={hasVideo ? "ok" : "warn"} className="mb-3">
                  <span className="flex items-start gap-2 font-semibold">
                    <Video className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {hasVideo
                      ? tx("ভিডিও পেয়েছি, ধন্যবাদ!", "Video added, thank you!")
                      : tx(
                          "পার্সেল খোলার (আনবক্সিং) ভিডিও থাকলে অবশ্যই দিন। ভিডিও থাকলে দাবি অনেক দ্রুত অনুমোদন হয়।",
                          "If you have an unboxing video, please add it. Claims with video are approved much faster.",
                        )}
                  </span>
                </Notice>
              )}
              <PhotoUploader value={photos} onChange={(v) => { setPhotos(v); setError(null); }} allowVideo />
              {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}

              <p className="mb-2 mt-5 font-semibold">
                🎤 {tx("ভয়েসে সমস্যা বলুন", "Describe by voice")} <span className="font-normal text-muted">({tx("ঐচ্ছিক", "optional")})</span>
              </p>
              {voice ? (
                <div className="space-y-2 rounded-2xl border border-line bg-card p-3">
                  <VoicePlayer src={voice.url} duration={voice.duration_sec} />
                  <button type="button" className="text-sm font-semibold text-danger" onClick={() => setVoice(null)}>
                    {tx("মুছে ফেলুন", "Remove")}
                  </button>
                </div>
              ) : showRecorder ? (
                <div className="rounded-2xl border border-line bg-card p-3">
                  <VoiceRecorder compact onSaved={setVoice} />
                </div>
              ) : (
                <Button variant="outline" full onClick={() => setShowRecorder(true)}>
                  🎤 {tx("রেকর্ড করুন", "Record")}
                </Button>
              )}

              <p className="mb-2 mt-5 font-semibold">
                {tx("লিখে বলুন", "Write it")} <span className="font-normal text-muted">({tx("ঐচ্ছিক", "optional")})</span>
              </p>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={tx("কী হয়েছে সংক্ষেপে লিখুন", "Briefly describe what happened")} />
            </section>

            <Button variant="accent" size="lg" full onClick={submit}>
              {tx("দাবি জমা দিন", "Submit claim")}
            </Button>
          </>
        )}

        <ContactUs message={tx(`অর্ডার ${order.order_no} নিয়ে সমস্যা`, `Problem with order ${order.order_no}`)} />
      </div>
    </Container>
  );
}
