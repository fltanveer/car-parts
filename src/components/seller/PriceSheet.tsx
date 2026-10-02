"use client";

import { useState } from "react";
import type { Vendor } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { NumberPad } from "../shared/Misc";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/primitives";
import { MarketHint, YouGet } from "./Money";

/** Calculator pad + market hint + live "you get" (file 02 §5.1). */
export function PriceEditor({ vendor, value, onChange, categoryId, condition }: { vendor: Vendor; value: number; onChange: (v: number) => void; categoryId?: string | null; condition?: string }) {
  return (
    <div className="space-y-3">
      <NumberPad value={value} onChange={onChange} />
      {categoryId !== undefined && <MarketHint categoryId={categoryId} condition={condition ?? "new"} price={value} />}
      <YouGet vendor={vendor} price={value} />
    </div>
  );
}

/** Bottom sheet price editor used from lists. */
export function PriceSheet({
  open, onClose, vendor, initial, onSave, title, categoryId, condition,
}: {
  open: boolean;
  onClose: () => void;
  vendor: Vendor;
  initial: number;
  onSave: (price: number) => void;
  title?: string;
  categoryId?: string | null;
  condition?: string;
}) {
  const { tx } = useT();
  return (
    <Sheet open={open} onClose={onClose} title={title ?? tx("দাম বদলান", "Change price")}>
      {open && <PriceBody key={initial} vendor={vendor} initial={initial} onSave={onSave} onClose={onClose} categoryId={categoryId} condition={condition} />}
    </Sheet>
  );
}

function PriceBody({ vendor, initial, onSave, onClose, categoryId, condition }: { vendor: Vendor; initial: number; onSave: (p: number) => void; onClose: () => void; categoryId?: string | null; condition?: string }) {
  const { tx } = useT();
  const [v, setV] = useState(initial);
  return (
    <div className="space-y-3 pb-2">
      <PriceEditor vendor={vendor} value={v} onChange={setV} categoryId={categoryId} condition={condition} />
      <Button
        variant="ok"
        size="lg"
        full
        disabled={v <= 0}
        onClick={() => {
          onSave(v);
          onClose();
        }}
      >
        ✅ {tx("দাম সেভ করুন", "Save price")}
      </Button>
    </div>
  );
}
