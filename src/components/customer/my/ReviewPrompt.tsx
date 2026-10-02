"use client";

import { Mic, Send } from "lucide-react";
import { useState } from "react";
import { submitReview } from "@/lib/db/actions";
import { reviewTags } from "@/lib/mock/catalog";
import type { VoiceNote } from "@/lib/types";
import { VoiceRecorder } from "../../media/VoiceRecorder";
import { StarInput } from "../../shared/Badges";
import { toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, Chip, Textarea } from "../../ui/primitives";

/** After delivery: 5 stars + chip tags, typing optional, 🎤 allowed (file 01 §7.1). */
export function ReviewPrompt({ vendorOrderId, shopName }: { vendorOrderId: string; shopName: string }) {
  const { tx, L } = useT();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<VoiceNote | null>(null);
  const [recording, setRecording] = useState(false);

  const send = () => {
    // Review has no voice field yet; we keep a marker so the team can find the note.
    const comment = [text.trim(), voice ? tx("🎤 ভয়েস রিভিউ দিয়েছেন", "🎤 Left a voice review") : ""].filter(Boolean).join(" · ") || null;
    submitReview(vendorOrderId, rating, tags, comment);
    toast(tx("ধন্যবাদ! আপনার রিভিউ অন্যদের সাহায্য করবে", "Thanks! Your review helps others"));
  };

  return (
    <div id="review" className="space-y-3 rounded-2xl border-2 border-wait-bg/50 bg-wait-soft/50 p-4">
      <p className="font-bold">⭐ {tx(`${shopName} কেমন ছিল?`, `How was ${shopName}?`)}</p>
      <StarInput value={rating} onChange={setRating} />
      {rating > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {reviewTags.map((t) => (
              <Chip key={t.id} active={tags.includes(t.id)} onClick={() => setTags((x) => (x.includes(t.id) ? x.filter((y) => y !== t.id) : [...x, t.id]))}>
                {L(t)}
              </Chip>
            ))}
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={tx("কিছু বলতে চাইলে লিখুন (ঐচ্ছিক)", "Anything to add? (optional)")} className="min-h-20" />
          {recording ? (
            <VoiceRecorder
              compact
              onSaved={(v) => {
                setVoice(v);
                setRecording(false);
              }}
            />
          ) : (
            <Button variant="outline" size="sm" onClick={() => setRecording(true)}>
              <Mic className="size-4" aria-hidden /> {voice ? tx("ভয়েস রাখা হয়েছে ✓", "Voice saved ✓") : tx("বলে দিন", "Say it")}
            </Button>
          )}
          <Button variant="ok" size="lg" full onClick={send}>
            <Send className="size-5" aria-hidden /> {tx("রিভিউ পাঠান", "Send review")}
          </Button>
        </>
      )}
    </div>
  );
}
