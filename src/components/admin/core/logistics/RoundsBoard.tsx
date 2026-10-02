"use client";

import { Plus, Wand2 } from "lucide-react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Notice } from "@/components/ui/primitives";
import { createRound, patchRound } from "@/lib/db/actions-admin-core";
import { getDb, useDb } from "@/lib/db/store";
import { markets } from "@/lib/mock/settings";
import { DataTable, Panel } from "../index";
import { activeRound, marketOf, sameDay, waitingParcels } from "./helpers";
import { RoundCard, roundLabel } from "./RoundCard";

/** Puts waiting parcels of a market on today's round for a slot (creating it if needed). */
const collect = (marketId: string, slot: string, now: number) => {
  const s = getDb();
  const ids = waitingParcels(s).filter((v) => marketOf(s, v) === marketId).map((v) => v.id);
  const existing = s.pickupRounds.find((r) => r.market_area === marketId && r.slot === slot && sameDay(r.date, now) && activeRound(r));
  if (existing) patchRound(existing.id, { vendor_order_ids: [...new Set([...existing.vendor_order_ids, ...ids])] });
  else {
    const rider = s.riders.find((r) => r.active && r.area === markets.find((m) => m.id === marketId)?.bn) ?? null;
    createRound(marketId, slot, new Date(now).toISOString(), ids, rider?.id ?? null);
  }
  return ids.length;
};

export function RoundsBoard({ now }: { now: number }) {
  const { tx, L, d, date } = useT();
  const rounds = useDb((s) => s.pickupRounds);
  const waiting = useDb(waitingParcels);
  const vendors = useDb((s) => s.vendors);
  const riders = useDb((s) => s.riders);
  const mk = (id: string) => vendors.find((v) => v.id === id)?.market_area ?? "other";

  const autoPlan = () => {
    let n = 0;
    for (const m of markets) {
      if (!m.slots.length) continue;
      const slot = m.slots.find((sl) => !rounds.some((r) => r.market_area === m.id && r.slot === sl && sameDay(r.date, now) && r.status === "done")) ?? m.slots[m.slots.length - 1];
      if (waiting.some((v) => mk(v.vendor_id) === m.id)) n += collect(m.id, slot, now);
    }
    toast(n ? tx(`${d(n)}টা পার্সেল রাউন্ডে যোগ হয়েছে`, `${n} parcels added to rounds`) : tx("অপেক্ষায় কোনো পার্সেল নেই", "No parcels waiting"), n ? "ok" : "info");
  };

  const past = rounds.filter((r) => !sameDay(r.date, now));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="brand" size="lg" onClick={autoPlan}>
          <Wand2 className="size-5" /> {tx("প্যাক হওয়া পার্সেল রাউন্ডে তুলুন", "Auto-collect packed parcels")}
        </Button>
        <span className="text-sm text-muted">{tx(`${d(waiting.length)}টা পার্সেল রাইডারের অপেক্ষায়`, `${waiting.length} parcels waiting for a rider`)}</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {markets.map((m) => {
          const wait = waiting.filter((v) => mk(v.vendor_id) === m.id);
          const today = rounds.filter((r) => r.market_area === m.id && sameDay(r.date, now));
          if (!m.slots.length && !wait.length && !today.length) return null;
          return (
            <Panel key={m.id} title={`${L(m)} · ${tx("আজ", "today")}`} actions={wait.length > 0 && <span className="rounded-full bg-wait-soft px-2.5 py-0.5 text-xs font-bold text-wait">{tx(`${d(wait.length)}টা অপেক্ষায়`, `${wait.length} waiting`)}</span>}>
              {!m.slots.length && <Notice tone="wait">{tx("এই বাজারে পিকআপ রাউন্ড নেই। সেটিংসে সময় যোগ করুন বা দোকানকে কুরিয়ারে পাঠাতে বলুন।", "No pickup slots here. Add a slot in settings or ask the seller to ship by courier.")}</Notice>}
              <div className="space-y-3">
                {m.slots.map((slot) => {
                  const r = today.find((x) => x.slot === slot);
                  return r ? (
                    <RoundCard key={slot} round={r} />
                  ) : (
                    <div key={slot} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-line p-3">
                      <span className="font-semibold">{slot}</span>
                      <Button size="sm" variant="outline" onClick={() => { const n = collect(m.id, slot, now); toast(tx(`রাউন্ড তৈরি · ${d(n)}টা পার্সেল`, `Round created · ${n} parcels`)); }}>
                        <Plus className="size-4" /> {tx("রাউন্ড তৈরি", "Create round")}
                      </Button>
                    </div>
                  );
                })}
                {wait.length > 0 && m.slots.length > 0 && today.some(activeRound) && (
                  <Button size="sm" variant="ghost" onClick={() => { const slot = today.find(activeRound)!.slot; collect(m.id, slot, now); }}>
                    <Plus className="size-4" /> {tx("অপেক্ষার পার্সেল চলতি রাউন্ডে যোগ", "Add waiting parcels to open round")}
                  </Button>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
      {past.length > 0 && (
        <DataTable
          caption={tx("আগের রাউন্ড", "Past rounds")}
          rows={past}
          rowKey={(r) => r.id}
          initialSort={{ key: "date", dir: "desc" }}
          columns={[
            { key: "date", header: tx("তারিখ", "Date"), cell: (r) => date(r.date), sort: (r) => r.date },
            { key: "m", header: tx("বাজার", "Market"), cell: (r) => L(markets.find((m) => m.id === r.market_area)) },
            { key: "slot", header: tx("সময়", "Slot"), cell: (r) => r.slot },
            { key: "rider", header: tx("রাইডার", "Rider"), cell: (r) => riders.find((x) => x.id === r.rider_id)?.name ?? "—" },
            { key: "n", header: tx("পার্সেল", "Parcels"), cell: (r) => d(r.vendor_order_ids.length) },
            { key: "st", header: tx("অবস্থা", "Status"), cell: (r) => L(roundLabel[r.status]) },
          ]}
        />
      )}
    </div>
  );
}
