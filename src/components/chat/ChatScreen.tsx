"use client";

import clsx from "clsx";
import { Camera, Clock, Loader2, MessageCircle, Mic, Phone, SendHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPartById } from "@/lib/api";
import { compressImage, uploadWithRetry } from "@/lib/blobstore";
import { telLink, siteUrl, waLink } from "@/lib/links";
import { isOpenHours } from "@/lib/rules";
import { sendChat, setState, uid, useHydrated, useStore } from "@/lib/store";
import type { ChatMessage, VoiceNote } from "@/lib/types";
import { VoiceRecorder } from "../media/VoiceRecorder";
import { useT } from "../providers/LangProvider";
import { ChatBubble } from "./ChatBubble";
import { OrderRefCard, PartRefCard, RequestRefCard } from "./RefCards";

type Ctx = { type: "part_card" | "order_card" | "request_card"; id: string };

// Spec 7.15: one support thread per user. Opened from a part / order /
// request page, that item is attached as the first message on send.
export function ChatScreen() {
  const { t, tx } = useT();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const chat = useStore((s) => s.chat);
  const orders = useStore((s) => s.orders);
  const requests = useStore((s) => s.requests);

  const [text, setText] = useState("");
  const [showMic, setShowMic] = useState(false);
  const [uploading, setUploading] = useState<false | "busy" | number>(false);
  const [ctxDone, setCtxDone] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ctx = useMemo<Ctx | null>(() => {
    const part = params.get("part");
    const order = params.get("order");
    const request = params.get("request");
    if (part && getPartById(part)) return { type: "part_card", id: part };
    if (order && orders.some((o) => o.id === order)) return { type: "order_card", id: order };
    if (request && requests.some((r) => r.id === request)) return { type: "request_card", id: request };
    return null;
  }, [params, orders, requests]);

  const pendingCtx = ctx && !ctxDone ? ctx : null;

  // WhatsApp prefill: part name + link / order no / request no (spec 7.15).
  const waText = useMemo(() => {
    const hi = tx("আসসালামু আলাইকুম, ", "Hello, ");
    if (ctx?.type === "part_card") {
      const p = getPartById(ctx.id)!;
      return `${hi}${tx("এই পার্টটা নিয়ে জানতে চাই", "I have a question about this part")}: ${p.name_bn} (${p.part_number}) ${siteUrl(`/part/${p.slug}`)}`;
    }
    if (ctx?.type === "order_card") {
      const o = orders.find((x) => x.id === ctx.id);
      return `${hi}${tx("আমার অর্ডার নম্বর", "my order number is")} ${o?.order_no ?? ""}`;
    }
    if (ctx?.type === "request_card") {
      const r = requests.find((x) => x.id === ctx.id);
      return `${hi}${tx("আমার রিকোয়েস্ট নম্বর", "my request number is")} ${r?.request_no ?? ""}`;
    }
    return `${hi}${tx("আমার একটা পার্ট লাগবে।", "I need a part.")}`;
  }, [ctx, orders, requests, tx]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [chat.length, hydrated, showMic]);

  const attachContext = () => {
    if (!pendingCtx) return;
    // Added without triggering a second auto-reply.
    const card: ChatMessage = {
      id: uid(),
      sender_type: "user",
      type: pendingCtx.type,
      body: null,
      ref_id: pendingCtx.id,
      created_at: new Date().toISOString(),
    };
    setState((s) => ({ chat: [...s.chat, card] }));
    setCtxDone(true);
  };

  const sendText = () => {
    const body = text.trim();
    if (!body) return;
    attachContext();
    sendChat({ type: "text", body });
    setText("");
  };

  const sendVoice = (v: VoiceNote) => {
    attachContext();
    sendChat({ type: "voice", body: null, voice: v });
    setShowMic(false);
  };

  const onFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading("busy");
    try {
      const blob = await compressImage(file);
      const id = uid();
      const url = await uploadWithRetry(id, blob, (a) => setUploading(a));
      attachContext();
      sendChat({ type: "image", body: null, image: { id, url, kind: "image", name: file.name } });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const closed = hydrated && !isOpenHours();
  const iconBtn = "grid size-12 shrink-0 place-items-center rounded-full transition-colors";

  return (
    <div className="fixed inset-x-0 bottom-0 top-[57px] z-30 flex flex-col bg-surface">
      {/* Title + call / WhatsApp shortcuts */}
      <div className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold leading-tight">{tx("সাপোর্ট চ্যাট", "Support chat")}</h1>
            <p className="flex items-center gap-1 text-xs text-muted">
              <span className={clsx("inline-block size-2 rounded-full", closed ? "bg-muted" : "bg-ok")} aria-hidden />
              {closed ? tx("এখন অফিস বন্ধ", "Office closed now") : tx("আমরা অনলাইনে আছি", "We're online")}
            </p>
          </div>
          <a
            href={telLink()}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-q-oem px-3.5 text-sm font-semibold text-white"
          >
            <Phone className="size-4" aria-hidden /> {t("call")}
          </a>
          <a
            href={waLink(waText)}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 text-sm font-semibold text-white"
            aria-label="WhatsApp"
          >
            <MessageCircle className="size-4" aria-hidden />
            <span className="hidden min-[400px]:inline">{t("whatsapp")}</span>
          </a>
        </div>
      </div>

      {/* Thread */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-live="polite">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4">
          {closed && (
            <div className="flex items-start gap-2 rounded-xl border border-accent/40 bg-accent-soft px-3.5 py-3 text-sm text-accent-ink" role="status">
              <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>{t("offline_hours")}</p>
            </div>
          )}
          {!hydrated ? (
            <div className="h-24 animate-pulse rounded-2xl bg-line/60" />
          ) : chat.length === 0 ? (
            <p className="py-8 text-center text-muted">
              {tx("কোন পার্ট লাগবে লিখুন, বলুন বা ছবি দিন।", "Tell us which part you need: type, speak or send a photo.")}
            </p>
          ) : (
            chat.map((m) => <ChatBubble key={m.id} m={m} />)
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-line bg-card pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-3xl px-3 pt-2">
          {pendingCtx && (
            <div className="mb-2 flex items-start gap-2 rounded-xl bg-surface p-2">
              <div className="min-w-0 flex-1">
                <p className="mb-1 px-1 text-xs font-semibold text-muted">
                  {tx("এই বিষয়ে কথা বলছেন (প্রথম মেসেজের সাথে যাবে)", "About this (sent with your first message)")}
                </p>
                {pendingCtx.type === "part_card" && <PartRefCard partId={pendingCtx.id} className="w-full" />}
                {pendingCtx.type === "order_card" && <OrderRefCard orderId={pendingCtx.id} className="w-full" />}
                {pendingCtx.type === "request_card" && <RequestRefCard requestId={pendingCtx.id} className="w-full" />}
              </div>
              <button
                type="button"
                onClick={() => setCtxDone(true)}
                aria-label={tx("সরিয়ে দিন", "Remove")}
                className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-line"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {showMic && (
            <div className="relative mb-2 rounded-2xl border border-line bg-surface px-3">
              <button
                type="button"
                onClick={() => setShowMic(false)}
                aria-label={t("close")}
                className="absolute right-1.5 top-1.5 z-10 grid size-9 place-items-center rounded-full hover:bg-line"
              >
                <X className="size-4" />
              </button>
              <VoiceRecorder compact sendLabel={tx("পাঠান", "Send")} onSaved={sendVoice} />
            </div>
          )}

          {uploading !== false && (
            <p className="mb-2 flex items-center gap-2 px-1 text-sm text-muted" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {uploading === "busy"
                ? tx("ছবি পাঠানো হচ্ছে…", "Sending photo…")
                : tx("নেটওয়ার্ক ধীর, আবার চেষ্টা করছি…", "Slow network, retrying…")}
            </p>
          )}

          <form
            className="flex items-center gap-1.5 pb-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendText();
            }}
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading !== false}
              aria-label={tx("ছবি পাঠান", "Send a photo")}
              className={clsx(iconBtn, "bg-surface text-ink hover:bg-line disabled:opacity-50")}
            >
              <Camera className="size-5.5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => setShowMic((v) => !v)}
              aria-label={tx("ভয়েস নোট", "Voice note")}
              aria-pressed={showMic}
              className={clsx(iconBtn, showMic ? "bg-danger text-white" : "bg-danger/10 text-danger hover:bg-danger/15")}
            >
              <Mic className="size-5.5" />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={tx("মেসেজ লিখুন…", "Type a message…")}
              aria-label={tx("মেসেজ", "Message")}
              enterKeyHint="send"
              className="min-h-12 min-w-0 flex-1 rounded-full border-2 border-line bg-card px-4 text-base outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              aria-label={t("submit")}
              className={clsx(iconBtn, "bg-ink text-white disabled:bg-line disabled:text-muted")}
            >
              <SendHorizontal className="size-5.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
