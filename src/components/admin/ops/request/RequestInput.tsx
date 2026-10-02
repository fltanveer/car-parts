"use client";

import { MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { useT } from "@/components/providers/LangProvider";
import { MediaThumb } from "@/components/media/PhotoUploader";
import { StatusPill } from "@/components/ui/primitives";
import { describeVehicle } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import { conditionPrefLabel, neededByLabel, sourcePrefLabel } from "@/lib/labels";
import type { PartRequest } from "@/lib/types";
import { DeskVoicePlayer } from "../DeskVoicePlayer";
import { Panel, SourceIcon } from "../ui";

// Mock transcript until speech-to-text is wired; confidence derived from id.
const fakeConfidence = (id: string) => 45 + ([...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 40);

/** LEFT column: what the customer gave (file 03 6.2). */
export function RequestInput({ r }: { r: PartRequest }) {
  const { tx, L, d, taka, ago } = useT();
  const orders = useDb((s) => s.orders.filter((o) => o.user_phone === r.user_phone));
  const vehicles = useDb((s) => s.vehicles.filter((v) => v.owner === r.user_phone));
  const profile = useDb((s) => s.profiles.find((p) => p.phone === r.user_phone) ?? null);
  const name = r.contact_name ?? profile?.full_name ?? tx("নাম নেই", "No name");
  const digitsOnly = r.user_phone.replace(/\D/g, "");

  return (
    <div className="space-y-4">
      <Panel title={tx("কাস্টমারের দেওয়া", "From the customer")} action={<SourceIcon source={r.source} />}>
        <div className="space-y-4">
          {r.voice_notes.map((v) => (
            <div key={v.id} className="space-y-2">
              <DeskVoicePlayer src={v.url} duration={v.duration_sec} />
              <div className="rounded-xl bg-surface p-3 text-sm">
                <p className="mb-1 flex items-center justify-between text-xs font-semibold text-muted">
                  <span>{tx("AI ট্রান্সক্রিপ্ট (নমুনা)", "AI transcript (mock)")}</span>
                  <span>{tx(`নিশ্চয়তা ${d(fakeConfidence(v.id))}%`, `Confidence ${fakeConfidence(v.id)}%`)}</span>
                </p>
                <p className="italic text-ink-2">{tx(`"${r.vehicle_text ?? "গাড়ি"} এর একটা পার্ট লাগবে… (অস্পষ্ট অংশ)"`, `"Need a part for ${r.vehicle_text ?? "car"}… (unclear)"`)}</p>
              </div>
            </div>
          ))}
          {r.photos.length > 0 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {r.photos.map((p) => <MediaThumb key={p.id} item={p} />)}
            </div>
          )}
          {r.description_text && <p className="rounded-xl border border-line p-3">✍️ {r.description_text}</p>}
          {r.vehicle_text && <p className="text-sm">🚗 {tx("কাস্টমার লিখেছে:", "Customer wrote:")} <b>{r.vehicle_text}</b></p>}
          {!r.voice_notes.length && !r.photos.length && !r.description_text && <p className="text-sm text-muted">{tx("কোনো বিবরণ নেই", "No description")}</p>}
          <dl className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-surface p-2"><dt className="text-muted">{tx("উৎস", "Source")}</dt><dd className="font-semibold">{L(sourcePrefLabel[r.preferred_source])}</dd></div>
            <div className="rounded-lg bg-surface p-2"><dt className="text-muted">{tx("অবস্থা", "Condition")}</dt><dd className="font-semibold">{L(conditionPrefLabel[r.preferred_condition])}</dd></div>
            <div className="rounded-lg bg-surface p-2"><dt className="text-muted">{tx("কবে", "When")}</dt><dd className="font-semibold">{L(neededByLabel[r.needed_by])}</dd></div>
          </dl>
          <p className="text-xs text-muted">📍 {r.area}, {r.district} · {ago(r.created_at)}</p>
        </div>
      </Panel>

      <Panel title={tx("কাস্টমার", "Customer")} action={<Link href={`/admin/customers/${encodeURIComponent(r.user_phone)}`} className="text-sm font-semibold text-brand">{tx("৩৬০ ভিউ", "360 view")}</Link>}>
        <p className="font-bold">{name}</p>
        <p className="text-sm text-muted">{d(displayPhone(r.user_phone))}</p>
        {profile?.is_blocked && <StatusPill tone="bad">{tx("ব্লক করা", "Blocked")}</StatusPill>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={`tel:${r.user_phone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ok font-semibold text-white">
            <Phone className="size-4" /> {tx("কল", "Call")}
          </a>
          <a href={`https://wa.me/${digitsOnly}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-ok/40 font-semibold text-ok">
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        </div>
        {vehicles.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted">{tx("আমার গাড়ি", "Saved cars")}</p>
            <ul className="text-sm">
              {vehicles.map((v) => (
                <li key={v.id}>🚗 {describeVehicle(v.generation_id, v.engine_id)?.withYear ?? tx("সেট হয়নি", "Not set")} {v.registration_no && <span className="text-muted">· {v.registration_no}</span>}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-3">
          <p className="text-xs font-semibold text-muted">{tx(`আগের অর্ডার (${d(orders.length)})`, `Past orders (${orders.length})`)}</p>
          <ul className="text-sm">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand">{o.order_no}</Link> · {taka(o.grand_total)} · {ago(o.created_at)}
              </li>
            ))}
            {orders.length === 0 && <li className="text-muted">{tx("নতুন কাস্টমার", "New customer")}</li>}
          </ul>
        </div>
      </Panel>
    </div>
  );
}
