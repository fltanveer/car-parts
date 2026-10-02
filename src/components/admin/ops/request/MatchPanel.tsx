"use client";

import clsx from "clsx";
import { Send } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { ShopLogo, toast } from "@/components/shared/Misc";
import { Button, Notice, StatusPill } from "@/components/ui/primitives";
import { audit, clarifyAndBroadcast } from "@/lib/db/actions";
import { syncRequestStatus } from "@/lib/db/actions-admin-ops";
import { getMarket, isVendorOpenNow, matchVendors } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { containsPersonalInfo } from "@/lib/rules";
import type { PartRequest } from "@/lib/types";
import { Panel } from "../ui";
import { draftPatch, type ClarifyDraft } from "./draft";

/** RIGHT column top: matching sellers + "send to shops". */
export function MatchPanel({ r, draft, widen }: { r: PartRequest; draft: ClarifyDraft; widen: boolean }) {
  const { tx, d, L } = useT();
  const db = useDb((s) => s);
  const [added, setAdded] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [pick, setPick] = useState("");

  const already = new Set(r.matches.map((m) => m.vendor_id));
  const cats = draft.items.map((i) => i.category_id).filter((x): x is string => !!x);
  const auto = (widen
    ? db.vendors.filter((v) => v.status === "active" && v.accepts_requests)
    : matchVendors(db, cats, draft.generation_id)
  ).map((v) => v.id);
  const selected = [...new Set([...auto, ...added])].filter((id) => !removed.includes(id) && !already.has(id));
  const others = db.vendors.filter((v) => v.status === "active" && !already.has(v.id) && !selected.includes(v.id));
  const vendor = (id: string) => db.vendors.find((v) => v.id === id)!;
  const patch = draftPatch(draft);
  const problems = [
    !patch.items.length && tx("আইটেম দিন", "Add an item"),
    !patch.summary_bn && tx("সারাংশ লিখুন", "Write the summary"),
    patch.summary_bn && containsPersonalInfo(patch.summary_bn) && tx("সারাংশ থেকে ব্যক্তিগত তথ্য সরান", "Remove personal info from summary"),
    !selected.length && tx("অন্তত একটা দোকান বাছুন", "Pick at least one shop"),
    ["accepted", "cancelled", "not_found", "expired"].includes(r.status) && tx("রিকোয়েস্ট বন্ধ", "Request is closed"),
  ].filter(Boolean) as string[];

  const send = () => {
    clarifyAndBroadcast(r.id, patch, selected);
    syncRequestStatus(r.id);
    audit(`রিকোয়েস্ট পাঠানো (${selected.length} দোকান)`, r.request_no);
    setAdded([]);
    setRemoved([]);
    toast(tx(`${d(selected.length)}টা দোকানে পাঠানো হয়েছে`, `Sent to ${selected.length} shops`));
  };

  const row = (id: string, on: boolean) => {
    const v = vendor(id);
    return (
      <li key={id} className="flex items-center gap-2 py-1.5">
        <input
          type="checkbox"
          className="size-5"
          checked={on}
          onChange={(e) => {
            if (e.target.checked) {
              setRemoved((x) => x.filter((y) => y !== id));
              setAdded((x) => [...x, id]);
            } else {
              setRemoved((x) => [...x, id]);
              setAdded((x) => x.filter((y) => y !== id));
            }
          }}
          aria-label={v.shop_name_bn}
        />
        <ShopLogo name={v.shop_name_bn} color={v.logo_color} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{v.shop_name_bn}</span>
          <span className="block text-xs text-muted">
            {L(getMarket(v.market_area))} · {tx("স্কোর", "Score")} {d(v.score)} · {isVendorOpenNow(v) ? tx("খোলা", "Open") : tx("বন্ধ", "Closed")}
          </span>
        </span>
      </li>
    );
  };

  return (
    <Panel title={tx("মিলে যাওয়া দোকান", "Matching shops")} action={<span className="text-sm font-semibold">{d(selected.length)}</span>}>
      {r.matches.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold text-muted">{tx(`আগেই পাঠানো (${d(r.matches.length)})`, `Already sent (${r.matches.length})`)}</p>
          <ul className="space-y-1 text-sm">
            {r.matches.map((m) => (
              <li key={m.vendor_id} className="flex items-center justify-between gap-2">
                <span className="truncate">{vendor(m.vendor_id)?.shop_name_bn ?? m.vendor_id}</span>
                <StatusPill tone={m.declined ? "bad" : m.seen_at ? "ok" : "wait"}>{m.declined ? tx("না বলেছে", "Declined") : m.seen_at ? tx("দেখেছে", "Seen") : tx("দেখেনি", "Not seen")}</StatusPill>
              </li>
            ))}
          </ul>
        </div>
      )}
      {widen && <Notice tone="wait" className="mb-2">{tx("বড় এলাকা: সব সক্রিয় দোকান দেখানো হচ্ছে।", "Wider area: all active shops shown.")}</Notice>}
      <ul className={clsx("divide-y divide-line", !selected.length && "hidden")}>{selected.map((id) => row(id, true))}</ul>
      {removed.filter((id) => !already.has(id)).length > 0 && <ul className="divide-y divide-line opacity-60">{removed.filter((id) => !already.has(id)).map((id) => row(id, false))}</ul>}
      {!selected.length && <p className="py-2 text-sm text-muted">{tx("স্বয়ংক্রিয়ভাবে কোনো দোকান মেলেনি। হাতে যোগ করুন।", "No automatic match. Add shops manually.")}</p>}
      <div className="mt-2 flex gap-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className="min-h-10 min-w-0 flex-1 rounded-xl border-2 border-line bg-card px-2 text-sm" aria-label={tx("দোকান যোগ", "Add shop")}>
          <option value="">{tx("+ হাতে দোকান যোগ করুন", "+ Add a shop manually")}</option>
          {others.map((v) => (
            <option key={v.id} value={v.id}>
              {v.shop_name_bn} · {L(getMarket(v.market_area))}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          disabled={!pick}
          onClick={() => {
            setAdded((x) => [...x, pick]);
            setRemoved((x) => x.filter((y) => y !== pick));
            setPick("");
          }}
        >
          {tx("যোগ", "Add")}
        </Button>
      </div>
      {problems.length > 0 && <p className="mt-3 text-sm text-wait">⚠️ {problems.join(" · ")}</p>}
      <Button variant="brand" size="lg" full className="mt-3" disabled={problems.length > 0} onClick={send}>
        <Send className="size-5" /> {tx("দোকানে পাঠান", "Send to shops")}
      </Button>
    </Panel>
  );
}
