"use client";

import clsx from "clsx";
import { Star } from "lucide-react";
import { useState } from "react";
import { useT } from "../providers/LangProvider";
import { Button, Card, Textarea } from "../ui/primitives";

const key = (orderId: string) => `partsbd:review:${orderId}`;

const readSaved = (orderId: string): { rating: number; text: string } | null => {
  try {
    const raw = localStorage.getItem(key(orderId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Spec 7.12: ask for a review after delivery. Local-only until the reviews
// API exists. Only mounted client-side after hydration.
export function ReviewPrompt({ orderId }: { orderId: string }) {
  const { tx, d } = useT();
  const [saved, setSaved] = useState(() => readSaved(orderId));
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  if (saved)
    return (
      <Card className="no-print p-4">
        <p className="font-semibold">{tx("রিভিউ দেওয়ার জন্য ধন্যবাদ!", "Thanks for your review!")}</p>
        <p className="mt-1 flex items-center gap-1 text-accent" aria-label={`${saved.rating}/5`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className="size-5" fill={i < saved.rating ? "currentColor" : "none"} aria-hidden />
          ))}
        </p>
        {saved.text && <p className="mt-1 text-sm text-ink-2">{saved.text}</p>}
      </Card>
    );

  const submit = () => {
    const v = { rating, text: text.trim() };
    try {
      localStorage.setItem(key(orderId), JSON.stringify(v));
    } catch {
      /* keep in memory */
    }
    setSaved(v);
  };

  return (
    <Card className="no-print p-4">
      <p className="font-bold">{tx("পার্ট কেমন লাগলো?", "How was your part?")}</p>
      <p className="text-sm text-muted">{tx("আপনার রিভিউ অন্য গাড়ির মালিকদের সাহায্য করবে", "Your review helps other car owners")}</p>
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label={tx("রেটিং", "Rating")}>
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={rating === i + 1}
            aria-label={`${d(i + 1)} ${tx("তারা", "stars")}`}
            onClick={() => setRating(i + 1)}
            className={clsx("grid size-12 place-items-center rounded-xl", i < rating ? "text-accent" : "text-line")}
          >
            <Star className="size-8" fill="currentColor" aria-hidden />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <div className="mt-3 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={tx("কিছু লিখতে চাইলে লিখুন (ঐচ্ছিক)", "Anything to add? (optional)")}
          />
          <Button variant="primary" size="lg" full onClick={submit}>
            {tx("রিভিউ দিন", "Submit review")}
          </Button>
        </div>
      )}
    </Card>
  );
}
