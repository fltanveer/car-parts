"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { MediaImage } from "@/components/ui/MediaImage";
import { Button, Input, Select } from "@/components/ui/primitives";
import { fitsVehicle, publicListings } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { conditionLabel, sourceLabel } from "@/lib/labels";
import { Panel } from "../../index";

/** Search live listings across all sellers and add them to the phone cart. */
export function ListingSearch({ vehicles, onAdd, inCart }: { vehicles: { id: string; label: string; generation_id: string | null }[]; onAdd: (listingId: string) => void; inCart: (id: string) => number }) {
  const { tx, L, taka, d } = useT();
  const [q, setQ] = useState("");
  const [veh, setVeh] = useState("");
  const listings = useDb(publicListings);
  const vendors = useDb((s) => s.vendors);
  const gen = vehicles.find((v) => v.id === veh)?.generation_id ?? null;

  const results = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/-/g, "");
    return listings
      .filter((l) => {
        if (gen && fitsVehicle(l.fitments, l.is_universal, gen) === false) return false;
        if (!t) return !!gen;
        const shop = vendors.find((v) => v.id === l.vendor_id);
        return `${l.title} ${l.title_bn} ${l.part_number ?? ""} ${shop?.shop_name ?? ""} ${shop?.shop_name_bn ?? ""}`.toLowerCase().replace(/-/g, "").includes(t);
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, 20);
  }, [listings, vendors, q, gen]);

  return (
    <Panel title={<span className="flex items-center gap-2"><Search className="size-5" /> {tx("২. পণ্য খুঁজুন (যেকোনো দোকান)", "2. Find items (any seller)")}</span>}>
      <div className="flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("নাম, পার্ট নম্বর বা দোকান", "Name, part number or shop")} className="min-w-48 flex-1" />
        {vehicles.length > 0 && (
          <Select value={veh} onChange={(e) => setVeh(e.target.value)} className="w-auto max-w-64">
            <option value="">{tx("সব গাড়ি", "Any car")}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{tx("শুধু ফিট: ", "Fits: ")}{v.label}</option>
            ))}
          </Select>
        )}
      </div>
      <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto">
        {results.map((l) => {
          const shop = vendors.find((v) => v.id === l.vendor_id);
          const n = inCart(l.id);
          return (
            <li key={l.id} className="flex items-center gap-3 rounded-xl border border-line p-2">
              <MediaImage src={l.media[0]?.url} alt={l.title_bn} className="size-12 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-semibold">{l.title_bn}</p>
                <p className="truncate text-xs text-muted">
                  {shop?.shop_name_bn} · {L(sourceLabel[l.source])} · {L(conditionLabel[l.condition])}{l.grade ? ` ${l.grade}` : ""} · {tx("স্টক", "Stock")} {d(l.stock_qty)}
                  {l.part_number ? ` · ${l.part_number}` : ""}
                </p>
              </div>
              <span className="shrink-0 font-bold tabular-nums">{taka(l.price)}</span>
              <Button size="sm" variant={n ? "ok" : "outline"} disabled={n >= l.stock_qty} onClick={() => onAdd(l.id)} aria-label={tx("কার্টে যোগ", "Add to cart")}>
                <Plus className="size-4" /> {n ? d(n) : tx("যোগ", "Add")}
              </Button>
            </li>
          );
        })}
        {results.length === 0 && <li className="py-6 text-center text-sm text-muted">{q || gen ? tx("কিছু পাওয়া যায়নি", "No matches") : tx("খুঁজতে লিখুন বা গাড়ি বাছুন", "Type to search or pick a car")}</li>}
      </ul>
    </Panel>
  );
}
