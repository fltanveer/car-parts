"use client";

import { useEffect, useState } from "react";
import { getCategory } from "@/lib/db/queries";
import type { Condition, Listing, MediaItem, Vendor } from "@/lib/types";

/** Short cash-register style beep for new orders (file 02 §1.6). Guarded: silent if blocked. */
export const playBeep = (kind: "order" | "request" = "order") => {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = kind === "order" ? [880, 1320, 1760] : [660, 990];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.11);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.12);
    });
    setTimeout(() => void ctx.close(), 800);
  } catch {
    /* audio blocked until the user taps; ignore */
  }
};

/**
 * State that survives reloads / lost network (draft auto-save, rule 9).
 * Only use under <SellerGate> (renders after hydration).
 */
export function useLocalDraft<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void, () => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw) as T;
      return initial && typeof initial === "object" && !Array.isArray(initial) ? ({ ...initial, ...parsed } as T) : parsed;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      /* storage full */
    }
  }, [key, val]);
  const clear = () => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setVal(initial);
  };
  return [val, setVal, clear];
}

export const hasDraft = (key: string) => {
  try {
    return !!localStorage.getItem(key);
  } catch {
    return false;
  }
};

/** Seller-side prohibited items check (file 04 §10). Returns Bangla/English reasons. */
export const prohibitedCheck = (a: { categoryId: string | null; condition: Condition | null; title?: string; attributes?: Record<string, unknown> }, today: number) => {
  const c = getCategory(a.categoryId);
  const out: { bn: string; en: string; block: boolean }[] = [];
  const used = a.condition && a.condition !== "new";
  if (c?.attribute_template === "BRAKE" && used && /প্যাড|শু|pad|shoe/i.test(`${c.name} ${c.name_bn}`)) out.push({ bn: "পুরনো ব্রেক প্যাড/শু বিক্রি নিষিদ্ধ (নিরাপত্তা)।", en: "Used brake pads/shoes are prohibited (safety).", block: true });
  if (c?.attribute_template === "GAS_KIT" && used && !a.attributes?.retest_date) out.push({ bn: "রিটেস্ট সনদ ছাড়া পুরনো গ্যাস সিলিন্ডার নিষিদ্ধ। রিটেস্টের তারিখ দিন।", en: "Used gas cylinders need a retest date/certificate.", block: true });
  const exp = a.attributes?.expiry;
  if (c?.attribute_template === "FLUID" && typeof exp === "string" && new Date(exp).getTime() < today) out.push({ bn: "মেয়াদ শেষ তেল/তরল বিক্রি নিষিদ্ধ।", en: "Expired oils/fluids are prohibited.", block: true });
  if (a.title && /নম্বর প্লেট|number plate|সাইরেন|siren|হাইড্রলিক হর্ন|police|পুলিশ/i.test(a.title)) out.push({ bn: "নম্বর প্লেট, সাইরেন, পুলিশ চিহ্ন বিক্রি নিষিদ্ধ।", en: "Number plates, sirens and police marks are prohibited.", block: true });
  if (a.title && /এয়ারব্যাগ|airbag/i.test(a.title) && used) out.push({ bn: "পুরনো এয়ারব্যাগ: টিম যাচাই করবে, ডিপ্লয় হওয়া হলে নিষিদ্ধ।", en: "Used airbags are reviewed; deployed ones are prohibited.", block: false });
  if (c?.attribute_template === "ENGINE_ASSY") out.push({ bn: "ইঞ্জিন নম্বর টিম যাচাই করবে (চুরি ঠেকাতে)। নম্বর প্লেটের ছবি দিন।", en: "Engine number will be checked by the team. Add a photo of the number plate.", block: false });
  if (c?.attribute_template === "FLUID" && a.condition === "new") out.push({ bn: "নকল তেল ঠেকাতে ব্যাচ নম্বর ও সিলের ছবি দিন।", en: "Add batch number and seal photos.", block: false });
  return out;
};

export const mediaToListing = (items: MediaItem[]): Listing["media"] => items.filter((m) => m.kind === "image").map((m, i) => ({ url: m.url, role: i === 0 ? "main" : "other" }));
export const listingToMedia = (l: Pick<Listing, "media">): MediaItem[] => l.media.map((m, i) => ({ id: `${i}-${m.url}`, url: m.url, kind: m.role === "running_video" ? "video" : "image", name: `photo-${i + 1}` }));

/** Verification progress shown on home ("২/৪"): NID+selfie, trade licence, visit, payout. */
export const verificationProgress = (v: Vendor) => {
  const has = (t: string) => v.verifications.some((d) => d.doc_type === t && (d.status === "approved" || d.status === "submitted"));
  const steps = [
    { key: "nid", done: has("nid_front") && has("nid_back") && has("selfie") },
    { key: "trade", done: has("trade_license") },
    { key: "visit", done: has("visit_report") || v.verification_level >= 3 },
    { key: "payout", done: v.payout_methods.length > 0 },
  ];
  return { done: steps.filter((s) => s.done).length, total: steps.length, steps };
};
