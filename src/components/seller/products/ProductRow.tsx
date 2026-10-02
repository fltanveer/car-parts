"use client";

import clsx from "clsx";
import Link from "next/link";
import { setListingsStatus, setStock } from "@/lib/db/actions-seller";
import { listingStatusLabel } from "@/lib/labels";
import { listingQuality } from "@/lib/rules";
import type { Listing } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { Stars } from "../../shared/Badges";
import { toast } from "../../shared/Misc";
import { MediaImage } from "../../ui/MediaImage";
import { StatusPill } from "../../ui/primitives";
import { useFitText } from "../Bits";

/** Big thumbnail row with inline stock −/+, price ✏️ and pause/resume (file 02 §6). */
export function ProductRow({ l, selected, onSelect, onPrice }: { l: Listing; selected: boolean; onSelect: () => void; onPrice: () => void }) {
  const { tx, taka, d, L, lang } = useT();
  const fit = useFitText();
  const q = listingQuality(l).score;
  const canToggle = ["active", "paused", "sold_out"].includes(l.status);
  const btn = "grid size-12 place-items-center rounded-xl border-2 border-line bg-card text-xl font-bold disabled:opacity-40";
  return (
    <li className={clsx("space-y-3 rounded-2xl border-2 bg-card p-3", selected ? "border-brand" : "border-line")}>
      <div className="flex gap-3">
        <button type="button" onClick={onSelect} aria-pressed={selected} aria-label={tx("বাছাই", "Select")} className={clsx("grid size-8 shrink-0 place-items-center self-start rounded-lg border-2 text-sm", selected ? "border-brand bg-brand text-white" : "border-line")}>
          {selected ? "✓" : ""}
        </button>
        <Link href={`/seller/products/${l.id}`} className="flex min-w-0 flex-1 gap-3">
          <MediaImage src={l.media[0]?.url} alt={l.title_bn} className="size-20 shrink-0 rounded-xl" />
          <span className="min-w-0 flex-1 space-y-1">
            <span className="block font-bold leading-tight">{lang === "bn" ? l.title_bn : l.title}</span>
            <span className="block truncate text-sm text-muted">🚗 {fit(l)}</span>
            <span className="flex flex-wrap items-center gap-2">
              <StatusPill tone={listingStatusLabel[l.status].tone}>{L(listingStatusLabel[l.status])}</StatusPill>
              <Stars value={q / 20} />
            </span>
          </span>
        </Link>
      </div>
      {l.status === "rejected" && (
        <Link href={`/seller/products/${l.id}`} className="block rounded-xl bg-bad-soft p-3 text-sm text-bad">
          ❌ {l.rejection_reason ?? tx("কারণ জানানো হয়নি", "No reason given")} · <b className="underline">{tx("ঠিক করে আবার জমা দিন", "Fix & resubmit")}</b>
        </Link>
      )}
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onPrice} className="min-h-12 rounded-xl bg-surface px-3 text-lg font-bold">
          {taka(l.price)} ✏️
        </button>
        <div className="flex items-center gap-1.5">
          <button type="button" className={btn} disabled={l.stock_qty <= 0} onClick={() => setStock(l.id, l.stock_qty - 1)} aria-label="−">−</button>
          <span className={clsx("min-w-9 text-center text-lg font-bold tabular-nums", l.stock_qty === 0 && "text-bad")}>{d(l.stock_qty)}</span>
          <button type="button" className={btn} onClick={() => setStock(l.id, l.stock_qty + 1)} aria-label="+">+</button>
        </div>
        {canToggle && (
          <button
            type="button"
            onClick={() => {
              const to = l.status === "paused" ? (l.stock_qty > 0 ? "active" : "sold_out") : "paused";
              setListingsStatus([l.id], to);
              toast(to === "paused" ? tx("⏸️ বন্ধ করা হয়েছে", "⏸️ Paused") : tx("▶️ চালু হয়েছে", "▶️ Live"), "info");
            }}
            className={clsx("min-h-12 rounded-xl px-3 font-semibold", l.status === "paused" ? "bg-ok text-white" : "bg-surface")}
          >
            {l.status === "paused" ? tx("▶️ চালু", "▶️ Resume") : tx("⏸️ বন্ধ", "⏸️ Pause")}
          </button>
        )}
      </div>
    </li>
  );
}
