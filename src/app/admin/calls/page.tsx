"use client";

import { Phone } from "lucide-react";
import { useState } from "react";
import { CallLogForm } from "@/components/admin/ops/CallLogForm";
import { DataTable, FilterChips, OpsPage, Panel, useStaffName } from "@/components/admin/ops/ui";
import { useT } from "@/components/providers/LangProvider";
import { Button } from "@/components/ui/primitives";
import { markCallbackDone } from "@/lib/db/actions-admin-ops";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import type { CallLog } from "@/lib/types";

const CH = { phone_in: "📥", phone_out: "📤", whatsapp: "💬" } as const;

export default function CallsPage() {
  const { tx, d, ago, dateTime } = useT();
  const staffName = useStaffName();
  const logs = useDb((s) => s.callLogs);
  const callbacks = useDb((s) => s.callRequests.filter((c) => c.status === "pending"));
  const vendors = useDb((s) => s.vendors);
  const [prefill, setPrefill] = useState<{ phone: string; ref: string; n: number }>({ phone: "", ref: "", n: 0 });
  const [channel, setChannel] = useState<CallLog["channel"] | "all">("all");

  return (
    <OpsPage
      title={tx("কল লগ", "Call log")}
      guide={tx("প্রতিটা কলের পর এখানে ছোট করে লিখে রাখুন: কে, কেন, কী কথা হলো। ডান দিকে কলব্যাক অনুরোধ আছে, কল করে সম্পন্ন চাপুন।", "After every call, log who, why and what was said. Callback requests are on the right: call them and mark done.")}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <Panel title={tx("নতুন কল লগ", "New call log")}>
            <CallLogForm key={prefill.n} phone={prefill.phone} refNo={prefill.ref} />
          </Panel>
          <FilterChips<CallLog["channel"] | "all">
            value={channel}
            onChange={setChannel}
            items={[
              { value: "all", label: tx("সব", "All"), count: logs.length },
              { value: "phone_in", label: tx("📥 এসেছে", "📥 Incoming") },
              { value: "phone_out", label: tx("📤 করেছি", "📤 Outgoing") },
              { value: "whatsapp", label: "💬 WhatsApp" },
            ]}
          />
          <DataTable
            rows={logs.filter((l) => channel === "all" || l.channel === channel)}
            rowKey={(l) => l.id}
            initialSort={{ key: "at", dir: "desc" }}
            columns={[
              { key: "at", header: tx("সময়", "Time"), sort: (l) => l.created_at, cell: (l) => dateTime(l.created_at) },
              { key: "p", header: tx("ফোন", "Phone"), cell: (l) => <span>{CH[l.channel]} {d(displayPhone(l.phone))}</span> },
              { key: "pu", header: tx("উদ্দেশ্য", "Purpose"), cell: (l) => l.purpose },
              { key: "r", header: tx("যুক্ত", "Ref"), cell: (l) => l.ref ?? "—" },
              { key: "s", header: tx("সারাংশ", "Summary"), cell: (l) => <span className="line-clamp-3">{l.summary}</span> },
              { key: "w", header: tx("কে", "By"), cell: (l) => staffName(l.staff_id) },
            ]}
          />
        </div>
        <Panel title={tx(`কলব্যাক অনুরোধ (${d(callbacks.length)})`, `Callback requests (${callbacks.length})`)}>
          <ul className="space-y-3">
            {callbacks.map((c) => (
              <li key={c.id} className="rounded-xl bg-wait-soft p-3 text-sm">
                <p className="font-bold">{d(displayPhone(c.requester_phone))}</p>
                <p>{c.context}</p>
                <p className="text-xs text-muted">
                  {c.target_type === "vendor" ? tx(`দোকানের সাথে কথা: ${vendors.find((v) => v.id === c.target_id)?.shop_name_bn ?? ""}`, `Wants the shop: ${vendors.find((v) => v.id === c.target_id)?.shop_name ?? ""}`) : tx("সাপোর্ট", "Support")} · {ago(c.created_at)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a href={`tel:${c.requester_phone}`} onClick={() => setPrefill((p) => ({ phone: c.requester_phone, ref: c.context.split(" ")[0] ?? "", n: p.n + 1 }))} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-ok px-3 text-xs font-semibold text-white">
                    <Phone className="size-3.5" /> {tx("কল করুন", "Call")}
                  </a>
                  <Button size="sm" variant="outline" onClick={() => markCallbackDone(c.id)}>✔️ {tx("সম্পন্ন", "Done")}</Button>
                </div>
              </li>
            ))}
            {!callbacks.length && <li className="text-sm text-muted">{tx("কোনো কলব্যাক বাকি নেই", "No pending callbacks")}</li>}
          </ul>
        </Panel>
      </div>
    </OpsPage>
  );
}
