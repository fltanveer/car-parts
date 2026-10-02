"use client";

import { Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Field, Input } from "@/components/ui/primitives";
import { uid } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { Panel } from "../Panel";
import { marketsOverlay, saveMarket, type Market } from "./overlay";

export function MarketsEditor({ canEdit }: { canEdit: boolean }) {
  const { tx, d } = useT();
  const markets = marketsOverlay.useStore((o) => o.markets);
  const vendors = useDb((s) => s.vendors);
  const [editing, setEditing] = useState<Market | null>(null);
  const [isNew, setIsNew] = useState(false);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <Panel
        title={tx("বাজার এলাকা", "Market areas")}
        actions={canEdit && (
          <Button size="sm" variant="brand" onClick={() => { setEditing({ id: `mk-${uid()}`, bn: "", en: "", slots: [] }); setIsNew(true); }}>
            <Plus className="size-4" aria-hidden /> {tx("নতুন বাজার", "New market")}
          </Button>
        )}
      >
        <ul className="divide-y divide-line">
          {markets.map((m) => {
            const count = vendors.filter((v) => v.market_area === m.id).length;
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{m.bn} <span className="text-sm font-normal text-muted">· {m.en}</span></span>
                  <span className="block text-sm text-muted">
                    {d(count)} {tx("দোকান", "shops")} · {m.slots.length ? `${tx("পিকআপ", "Pickup")}: ${m.slots.join(", ")}` : tx("পিকআপ রাউন্ড নেই", "No pickup round")}
                  </span>
                </span>
                {canEdit && (
                  <Button size="sm" variant="outline" onClick={() => { setEditing(m); setIsNew(false); }}>
                    <Pencil className="size-4" aria-hidden /> {tx("সম্পাদনা", "Edit")}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
      {editing && <MarketForm key={editing.id} market={editing} isNew={isNew} onDone={() => setEditing(null)} />}
    </div>
  );
}

function MarketForm({ market, isNew, onDone }: { market: Market; isNew: boolean; onDone: () => void }) {
  const { tx } = useT();
  const [bn, setBn] = useState(market.bn);
  const [en, setEn] = useState(market.en);
  const [slots, setSlots] = useState<string[]>(market.slots);
  const [slot, setSlot] = useState("");

  const addSlot = () => {
    const v = slot.trim();
    if (!v || slots.includes(v)) return;
    setSlots([...slots, v]);
    setSlot("");
  };
  const save = () => {
    if (!bn.trim() || !en.trim()) return toast(tx("বাংলা ও ইংরেজি নাম দিন", "Enter both names"), "bad");
    saveMarket({ ...market, bn: bn.trim(), en: en.trim(), slots }, isNew);
    toast(tx("বাজার সেভ হয়েছে", "Market saved"));
    onDone();
  };

  return (
    <Panel title={isNew ? tx("নতুন বাজার", "New market") : tx("বাজার সম্পাদনা", "Edit market")} actions={<Button size="sm" variant="ghost" onClick={onDone} aria-label={tx("বন্ধ", "Close")}><X className="size-4" /></Button>}>
      <div className="space-y-3">
        <Field label={tx("নাম (বাংলা)", "Name (Bangla)")}>
          <Input value={bn} onChange={(e) => setBn(e.target.value)} placeholder="যেমন: ধোলাইখাল" />
        </Field>
        <Field label={tx("নাম (ইংরেজি)", "Name (English)")}>
          <Input value={en} onChange={(e) => setEn(e.target.value)} placeholder="e.g. Dholaikhal" />
        </Field>
        <div>
          <p className="mb-1.5 font-semibold">{tx("পিকআপ রাউন্ডের সময়", "Pickup slots")}</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {slots.map((s) => (
              <span key={s} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-surface pl-3 pr-1 text-sm font-semibold">
                {s}
                <button type="button" aria-label={tx("সরান", "Remove")} onClick={() => setSlots(slots.filter((x) => x !== s))} className="grid size-7 place-items-center rounded-full hover:bg-bad-soft hover:text-bad">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            {slots.length === 0 && <span className="text-sm text-muted">{tx("কোনো সময় নেই", "No slots")}</span>}
          </div>
          <div className="flex gap-2">
            <Input value={slot} onChange={(e) => setSlot(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSlot()} placeholder={tx("যেমন: সকাল ১১টা", "e.g. 11 am")} />
            <Button variant="outline" onClick={addSlot}><Plus className="size-4" aria-hidden /></Button>
          </div>
        </div>
        <Button variant="ok" size="lg" full onClick={save}>{tx("সেভ করুন", "Save")}</Button>
      </div>
    </Panel>
  );
}
