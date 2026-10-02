"use client";

import { Camera, Flag, Mic, Phone, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { markThreadRead, reportTarget, requestCallback, sendMessage } from "@/lib/db/actions";
import { vendorById } from "@/lib/db/queries";
import { useDb, useHydrated } from "@/lib/db/store";
import type { MediaItem } from "@/lib/types";
import { PhotoUploader } from "../../media/PhotoUploader";
import { VoiceRecorder } from "../../media/VoiceRecorder";
import { BackButton, ShopLogo, toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, ButtonLink, ChoiceCard, Container, EmptyState, Input } from "../../ui/primitives";
import { Sheet } from "../../ui/Sheet";
import { ChatBubble, ChatContextCard } from "./ChatParts";
import { LoginNeeded } from "./common";

const REASONS = [
  { v: "scam", bn: "প্রতারণা / বাইরে টাকা চাইছে", en: "Scam / asking to pay outside" },
  { v: "fake", bn: "নকল জিনিস", en: "Fake item" },
  { v: "wrong_info", bn: "ভুল তথ্য", en: "Wrong information" },
  { v: "other", bn: "খারাপ ব্যবহার / অন্য", en: "Rude / other" },
] as const;

/** /messages/[thread]: text, 🎤, 📷, cards, masked numbers, call request, 🚩 (file 01 §8). */
export function ChatView({ id }: { id: string }) {
  const { tx, lang } = useT();
  const hydrated = useHydrated();
  const db = useDb((s) => s);
  const t = db.threads.find((x) => x.id === id);
  const [text, setText] = useState("");
  const [panel, setPanel] = useState<"voice" | "photo" | "report" | null>(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const count = t?.messages.length ?? 0;

  useEffect(() => {
    if (t && t.unread_customer > 0) markThreadRead(t.id, "customer");
  }, [t]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [count]);

  if (!hydrated) return <Container className="h-96 animate-pulse" />;
  const phone = db.session.customerPhone;
  if (!phone)
    return (
      <Container>
        <BackButton href="/messages" />
        <LoginNeeded next={`/messages/${id}`} />
      </Container>
    );
  if (!t || t.customer_phone !== phone)
    return (
      <Container>
        <BackButton href="/messages" />
        <EmptyState icon="💬" title={tx("কথোপকথন পাওয়া যায়নি", "Conversation not found")} action={<ButtonLink href="/messages">{tx("সব মেসেজ", "All messages")}</ButtonLink>} />
      </Container>
    );

  const v = vendorById(db, t.vendor_id);
  const support = t.type === "customer_support";
  const name = support ? tx("গাড়িহাব সাপোর্ট", "GaariHub support") : v ? (lang === "bn" ? v.shop_name_bn : v.shop_name) : "—";

  const send = () => {
    if (!text.trim()) return;
    sendMessage(t.id, "customer", { type: "text", body: text.trim() });
    setText("");
  };
  const callMe = () => {
    requestCallback(support ? "support" : "vendor", t.vendor_id, `চ্যাট: ${name}`);
    toast(support ? tx("আমাদের টিম শিগগিরই কল করবে", "Our team will call you shortly") : tx("দোকানকে কল করতে বলা হয়েছে। আপনার নম্বর গোপন থাকবে।", "The shop has been asked to call back. Your number stays private."));
  };

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <Container className="sticky top-14 z-20 border-b border-line bg-surface/95 pb-2 backdrop-blur">
        <BackButton href="/messages" label={tx("সব মেসেজ", "All messages")} />
        <div className="flex items-center gap-3">
          {support ? (
            <span className="grid size-11 place-items-center rounded-full bg-brand text-xl text-white" aria-hidden>
              🛟
            </span>
          ) : (
            <ShopLogo name={name} color={v?.logo_color ?? "#64748b"} />
          )}
          <p className="min-w-0 flex-1 truncate text-lg font-bold">{name}</p>
          <button type="button" onClick={callMe} className="grid size-11 place-items-center rounded-xl bg-ok-soft text-ok" aria-label={tx("কল অনুরোধ", "Request a call")}>
            <Phone className="size-5" />
          </button>
          {!support && (
            <button type="button" onClick={() => setPanel("report")} className="grid size-11 place-items-center rounded-xl bg-bad-soft text-bad" aria-label={tx("রিপোর্ট", "Report")}>
              <Flag className="size-5" />
            </button>
          )}
        </div>
      </Container>

      <Container className="flex-1 space-y-3 py-3">
        <ChatContextCard db={db} thread={t} />
        <p className="rounded-xl bg-wait-soft px-3 py-2 text-center text-xs font-medium text-wait">
          🔒 {tx("নম্বর বা লিংক শেয়ার করলে লুকিয়ে যাবে। অ্যাপের বাইরে কিনলে টাকা ফেরতের সুরক্ষা পাবেন না।", "Phone numbers and links are hidden. Buying outside the app loses your money-back protection.")}
        </p>
        {t.messages.map((m) => (
          <ChatBubble key={m.id} db={db} m={m} />
        ))}
        <div ref={end} />
      </Container>

      <div className="sticky bottom-0 z-20 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]">
        <Container className="flex items-end gap-2 py-2">
          <button type="button" onClick={() => setPanel("voice")} className="grid size-12 shrink-0 place-items-center rounded-full bg-bad text-white" aria-label={tx("ভয়েস পাঠান", "Send voice")}>
            <Mic className="size-6" />
          </button>
          <button type="button" onClick={() => setPanel("photo")} className="grid size-12 shrink-0 place-items-center rounded-full bg-surface" aria-label={tx("ছবি পাঠান", "Send photo")}>
            <Camera className="size-6" />
          </button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={tx("লিখুন…", "Type…")}
            className="flex-1"
            aria-label={tx("মেসেজ", "Message")}
          />
          <button type="button" onClick={send} disabled={!text.trim()} className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-white disabled:opacity-40" aria-label={tx("পাঠান", "Send")}>
            <Send className="size-5" />
          </button>
        </Container>
      </div>

      <Sheet open={panel === "voice"} onClose={() => setPanel(null)} title={`🎤 ${tx("ভয়েস মেসেজ", "Voice message")}`}>
        <VoiceRecorder
          sendLabel={tx("পাঠান", "Send")}
          onSaved={(voice) => {
            sendMessage(t.id, "customer", { type: "voice", voice, body: null });
            setPanel(null);
          }}
        />
      </Sheet>
      <Sheet open={panel === "photo"} onClose={() => setPanel(null)} title={`📷 ${tx("ছবি পাঠান", "Send photos")}`}>
        <div className="space-y-3 pb-3">
          <PhotoUploader value={photos} onChange={setPhotos} max={4} />
          <Button
            variant="brand"
            size="lg"
            full
            disabled={!photos.length}
            onClick={() => {
              photos.forEach((image) => sendMessage(t.id, "customer", { type: "image", image, body: null }));
              setPhotos([]);
              setPanel(null);
            }}
          >
            <Send className="size-5" aria-hidden /> {tx("পাঠান", "Send")}
          </Button>
        </div>
      </Sheet>
      <Sheet open={panel === "report"} onClose={() => setPanel(null)} title={`🚩 ${tx("কেন রিপোর্ট করছেন?", "Why report?")}`}>
        <div className="space-y-2 pb-3">
          {REASONS.map((r) => (
            <ChoiceCard
              key={r.v}
              icon="🚩"
              title={tx(r.bn, r.en)}
              onClick={() => {
                reportTarget(t.vendor_id ? "vendor" : "message", t.vendor_id ?? t.id, r.v, `চ্যাট থ্রেড ${t.id}`);
                setPanel(null);
                toast(tx("রিপোর্ট পেয়েছি। আমাদের টিম দেখবে।", "Report received. Our team will check."));
              }}
            />
          ))}
        </div>
      </Sheet>
    </div>
  );
}
