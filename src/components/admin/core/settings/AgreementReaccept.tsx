"use client";

import { RefreshCcw } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Notice } from "@/components/ui/primitives";
import { audit } from "@/lib/db/actions";
import { notifyVendor } from "@/lib/db/actions-admin-core";
import { getDb, update, useDb } from "@/lib/db/store";
import { Panel } from "../Panel";

/** New seller-agreement version → every active seller must accept again. */
const askReaccept = (version: number) => {
  const ids = getDb().vendors.filter((v) => v.status === "active").map((v) => v.id);
  update((s) => ({ vendors: s.vendors.map((v) => (ids.includes(v.id) ? { ...v, agreement_accepted_at: null } : v)) }));
  ids.forEach((id) => notifyVendor(id, "বিক্রেতা চুক্তি বদলেছে", `নতুন চুক্তি (v${version}) পড়ে আবার গ্রহণ করুন`, "/seller/shop"));
  audit("বিক্রেতা চুক্তি পুনরায় গ্রহণের অনুরোধ", `v${version} · ${ids.length} বিক্রেতা`);
  return ids.length;
};

export function AgreementReaccept({ canEdit, version }: { canEdit: boolean; version: number }) {
  const { tx, d } = useT();
  const active = useDb((s) => s.vendors.filter((v) => v.status === "active"));
  const pending = active.filter((v) => !v.agreement_accepted_at);
  const [confirm, setConfirm] = useState(false);

  return (
    <Panel title={tx("বিক্রেতাদের আবার চুক্তি গ্রহণ", "Ask sellers to re-accept")}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-ok-soft p-3 text-ok">
          <p className="text-sm font-semibold">{tx("গ্রহণ করেছে", "Accepted")}</p>
          <p className="text-2xl font-bold">{d(active.length - pending.length)}</p>
        </div>
        <div className={pending.length ? "rounded-xl bg-wait-soft p-3 text-wait" : "rounded-xl bg-surface p-3"}>
          <p className="text-sm font-semibold">{tx("আবার গ্রহণ বাকি", "Pending re-acceptance")}</p>
          <p className="text-2xl font-bold">{d(pending.length)}</p>
        </div>
      </div>
      {pending.length > 0 && (
        <p className="mt-2 text-sm text-muted">{pending.slice(0, 8).map((v) => v.shop_name_bn).join(", ")}{pending.length > 8 ? "…" : ""}</p>
      )}
      {canEdit &&
        (confirm ? (
          <Notice tone="wait" className="mt-3">
            <p className="font-semibold">
              {tx(`${d(active.length)}টা সক্রিয় দোকানকে চুক্তি v${d(version)} আবার গ্রহণ করতে বলা হবে। নিশ্চিত?`, `${active.length} active sellers will be asked to accept agreement v${version}. Sure?`)}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                variant="brand"
                onClick={() => {
                  const n = askReaccept(version);
                  setConfirm(false);
                  toast(tx(`${n}টা দোকানকে জানানো হয়েছে`, `${n} sellers notified`));
                }}
              >
                {tx("হ্যাঁ, পাঠান", "Yes, send")}
              </Button>
              <Button variant="ghost" onClick={() => setConfirm(false)}>{tx("না", "No")}</Button>
            </div>
          </Notice>
        ) : (
          <Button variant="outline" className="mt-3" onClick={() => setConfirm(true)}>
            <RefreshCcw className="size-4" aria-hidden /> {tx("সবাইকে আবার গ্রহণ করতে বলুন", "Ask all sellers to re-accept")}
          </Button>
        ))}
    </Panel>
  );
}
