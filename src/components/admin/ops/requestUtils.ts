import type { DB } from "@/lib/db/seed";
import type { PartRequest } from "@/lib/types";

export type DeskColumn = "clarify" | "sent" | "quotes" | "accepted" | "noquote" | "closed";
export const DESK_COLUMNS: { key: DeskColumn; bn: string; en: string; tone: "bad" | "wait" | "ok" | "info" }[] = [
  { key: "clarify", bn: "পরিষ্কার করতে হবে", en: "Needs clarification", tone: "bad" },
  { key: "sent", bn: "পাঠানো (দামের অপেক্ষা)", en: "Sent (awaiting quotes)", tone: "wait" },
  { key: "quotes", bn: "দাম এসেছে", en: "Quotes in", tone: "ok" },
  { key: "accepted", bn: "গ্রহণ হয়েছে", en: "Accepted", tone: "ok" },
  { key: "noquote", bn: "দাম আসেনি (২৪ ঘণ্টা+)", en: "No quotes 24h+", tone: "wait" },
  { key: "closed", bn: "বন্ধ", en: "Closed", tone: "info" },
];

const DAY = 86_400_000;

export const deskColumn = (r: PartRequest, s: DB, now: number): DeskColumn => {
  if (r.status === "new" || r.status === "needs_clarification") return "clarify";
  if (r.status === "quotes_received") return "quotes";
  if (r.status === "accepted") return "accepted";
  if (r.status === "open") {
    const hasQuote = s.quotes.some((q) => q.request_id === r.id && q.status !== "withdrawn");
    if (hasQuote) return "quotes";
    return r.broadcast_at && now - new Date(r.broadcast_at).getTime() > DAY ? "noquote" : "sent";
  }
  return "closed";
};
