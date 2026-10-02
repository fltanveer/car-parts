"use client";

import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { NumberPad, toast } from "@/components/shared/Misc";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Field, Input, Notice } from "@/components/ui/primitives";
import { audit, submitQuote } from "@/lib/db/actions";
import { markNotFound, sendFieldAgentToSearch } from "@/lib/db/actions-admin-ops";
import { conditionLabel, sourceLabel } from "@/lib/labels";
import type { Condition, PartRequest, Source } from "@/lib/types";
import { FilterChips, Panel } from "../ui";

const STORE_ID = "v-store";

/** No quotes? widen, field search, own-store quote, or tell customer "not found". */
export function NoQuoteActions({ r, widen, onWiden }: { r: PartRequest; widen: boolean; onWiden: () => void }) {
  const { tx, L } = useT();
  const [storeOpen, setStoreOpen] = useState(false);
  const [confirmNF, setConfirmNF] = useState(false);
  const [title, setTitle] = useState(r.items[0]?.name ?? "");
  const [price, setPrice] = useState(0);
  const [condition, setCondition] = useState<Condition>("new");
  const [source, setSource] = useState<Source>("oem_brand");
  const [dispatch, setDispatch] = useState(1);
  const [warranty, setWarranty] = useState(0);
  const closed = ["accepted", "cancelled", "not_found", "expired"].includes(r.status);
  const canQuote = ["open", "quotes_received"].includes(r.status);

  return (
    <Panel title={tx("দাম না এলে", "If no quotes come")}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Button variant="outline" onClick={onWiden} disabled={widen || closed}>
          🗺️ {tx("আরও দোকানে (বড় এলাকা)", "More shops (wider area)")}
        </Button>
        <Button
          variant="outline"
          disabled={r.team_searching || closed}
          onClick={() => {
            sendFieldAgentToSearch(r.id);
            toast(tx("মাঠকর্মীকে জানানো হয়েছে", "Field agent notified"));
          }}
        >
          🧭 {r.team_searching ? tx("মাঠে খোঁজা চলছে", "Field search on") : tx("মাঠকর্মী পাঠান", "Send field agent")}
        </Button>
        <Button variant="outline" onClick={() => setStoreOpen(true)} disabled={!canQuote}>
          🏬 {tx("নিজস্ব স্টোর থেকে দাম", "Quote from GaariHub Store")}
        </Button>
        <Button variant="danger" onClick={() => setConfirmNF(true)} disabled={closed}>
          🚫 {tx("কাস্টমারকে জানান: পাওয়া যায়নি", "Tell customer: not found")}
        </Button>
      </div>
      {!canQuote && !closed && <p className="mt-2 text-xs text-muted">{tx("স্টোরের দাম দিতে আগে দোকানে পাঠান।", "Send to shops first to quote from the store.")}</p>}

      <Sheet open={confirmNF} onClose={() => setConfirmNF(false)} title={tx("পাওয়া যায়নি?", "Not found?")}>
        <p className="mb-4">{tx("কাস্টমারকে SMS যাবে যে পার্টটি পাওয়া যায়নি। রিকোয়েস্ট বন্ধ হবে।", "The customer gets an SMS and the request closes.")}</p>
        <Button
          variant="danger"
          size="lg"
          full
          onClick={() => {
            markNotFound(r.id);
            setConfirmNF(false);
          }}
        >
          {tx("হ্যাঁ, জানিয়ে দিন", "Yes, notify")}
        </Button>
      </Sheet>

      <Sheet open={storeOpen} onClose={() => setStoreOpen(false)} title={tx("গাড়িহাব স্টোর থেকে দাম", "Quote from GaariHub Store")}>
        <div className="space-y-4 pb-2">
          <Field label={tx("পণ্যের নাম", "Item title")}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div>
            <p className="mb-1.5 font-semibold">{tx("অবস্থা", "Condition")}</p>
            <FilterChips<Condition> value={condition} onChange={setCondition} items={(["new", "used_import", "used_local", "refurbished"] as Condition[]).map((c) => ({ value: c, label: L(conditionLabel[c]) }))} />
          </div>
          <div>
            <p className="mb-1.5 font-semibold">{tx("উৎস", "Source")}</p>
            <FilterChips<Source> value={source} onChange={setSource} items={(["genuine", "oem_brand", "aftermarket", "local_made"] as Source[]).map((c) => ({ value: c, label: L(sourceLabel[c]) }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={tx("কত দিনে পাঠাবে", "Dispatch days")}>
              <Input type="number" min={0} value={dispatch} onChange={(e) => setDispatch(Math.max(0, Number(e.target.value)))} />
            </Field>
            <Field label={tx("ওয়ারেন্টি (দিন)", "Warranty (days)")}>
              <Input type="number" min={0} value={warranty} onChange={(e) => setWarranty(Math.max(0, Number(e.target.value)))} />
            </Field>
          </div>
          <NumberPad value={price} onChange={setPrice} />
          {price <= 0 && <Notice tone="wait">{tx("দাম বাধ্যতামূলক", "Price is required")}</Notice>}
          <Button
            variant="brand"
            size="lg"
            full
            disabled={price <= 0 || !title.trim()}
            onClick={() => {
              const res = submitQuote(r.id, STORE_ID, {
                item_index: 0, listing_id: null, title: title.trim(), source, condition, grade: condition === "new" ? null : "B", brand_id: null, part_number: null,
                price, dispatch_days: dispatch, warranty_days: warranty, is_returnable: true, media: ["ph:box"], note_bn: tx("গাড়িহাব স্টোর থেকে", "From GaariHub Store"),
              });
              if ("error" in res) {
                toast(res.error === "limit" ? tx("দামের সীমা পূর্ণ", "Quote limit reached") : tx("রিকোয়েস্ট বন্ধ", "Request closed"), "bad");
                return;
              }
              audit("স্টোর থেকে দাম", r.request_no);
              setStoreOpen(false);
              toast(tx("স্টোরের দাম যোগ হয়েছে", "Store quote added"));
            }}
          >
            {tx("দাম পাঠান", "Send quote")}
          </Button>
        </div>
      </Sheet>
    </Panel>
  );
}
