"use client";

import clsx from "clsx";
import { Send } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { VoicePlayer } from "@/components/media/VoicePlayer";
import { VoiceRecorder } from "@/components/media/VoiceRecorder";
import { MediaImage } from "@/components/ui/MediaImage";
import { Button, Textarea } from "@/components/ui/primitives";
import { supportReply } from "@/lib/db/actions-admin-ops-trust";
import type { ChatThread } from "@/lib/types";
import { Dictate } from "./Dictate";

const CANNED = [
  { bn: "আসসালামু আলাইকুম! কীভাবে সাহায্য করতে পারি?", en: "Hello! How can I help?" },
  { bn: "একটু অপেক্ষা করুন, দেখে জানাচ্ছি।", en: "One moment, checking for you." },
  { bn: "আপনার অর্ডার পথে আছে, ট্র্যাকিং নম্বর অর্ডার পেজে আছে।", en: "Your order is on the way; tracking is on the order page." },
  { bn: "অ্যাপের মাধ্যমে পেমেন্ট করলে টাকা ফেরতের সুরক্ষা পাবেন।", en: "Pay in the app to stay protected." },
  { bn: "আমরা আপনাকে কিছুক্ষণের মধ্যে কল করছি।", en: "We'll call you shortly." },
  { bn: "পণ্যের ছবি পরিষ্কার করে তুলুন, লেবেল সহ।", en: "Please take clear photos, including the label." },
];

/** Message list + optional support reply box. */
export function ThreadView({ t, canReply }: { t: ChatThread; canReply: boolean }) {
  const { tx, L, dateTime } = useT();
  const [text, setText] = useState("");
  const send = () => {
    if (!text.trim()) return;
    supportReply(t.id, text.trim());
    setText("");
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="max-h-[55vh] space-y-2 overflow-y-auto rounded-xl bg-surface p-3">
        {t.messages.map((m) => (
          <li key={m.id} className={clsx("flex", m.sender === "support" ? "justify-end" : m.sender === "system" ? "justify-center" : "justify-start")}>
            <div
              className={clsx(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                m.sender === "support" ? "bg-ink text-white" : m.sender === "system" ? "bg-wait-soft text-wait" : "bg-card",
                m.contains_contact_info && "ring-2 ring-bad",
              )}
            >
              {m.sender !== "support" && m.sender !== "system" && <p className="text-[11px] font-bold opacity-70">{m.sender === "customer" ? t.customer_name ?? tx("কাস্টমার", "Customer") : tx("বিক্রেতা", "Seller")}</p>}
              {m.type === "voice" && m.voice ? <VoicePlayer src={m.voice.url} duration={m.voice.duration_sec} dark={m.sender === "support"} /> : null}
              {m.type === "image" && m.image ? <MediaImage src={m.image.url} alt="" className="size-32 rounded-lg" /> : null}
              {m.body && <p>{m.body}</p>}
              {m.contains_contact_info && <p className="text-[11px] font-bold text-bad">⚠️ {tx("নম্বর শেয়ারের চেষ্টা", "Contact-sharing attempt")}</p>}
              <p className="mt-0.5 text-[10px] opacity-60">{dateTime(m.created_at)}</p>
            </div>
          </li>
        ))}
        {!t.messages.length && <li className="py-6 text-center text-sm text-muted">{tx("কোনো মেসেজ নেই", "No messages")}</li>}
      </ul>
      {canReply && (
        <div className="space-y-2">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {CANNED.map((c) => (
              <button key={c.bn} type="button" onClick={() => setText(L(c))} className="min-h-9 shrink-0 rounded-full border border-line bg-card px-3 text-xs hover:border-ink/40">
                {L(c)}
              </button>
            ))}
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-20" placeholder={tx("উত্তর লিখুন…", "Write a reply…")} onKeyDown={(e) => e.key === "Enter" && (e.ctrlKey || e.metaKey) && send()} />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="brand" onClick={send} disabled={!text.trim()}>
              <Send className="size-4" /> {tx("সাপোর্ট হিসেবে পাঠান", "Send as support")}
            </Button>
            <Dictate onText={(x) => setText((s) => (s ? `${s} ${x}` : x))} />
          </div>
          <VoiceRecorder compact sendLabel={tx("ভয়েস পাঠান", "Send voice")} onSaved={(v) => supportReply(t.id, null, v)} />
        </div>
      )}
    </div>
  );
}
