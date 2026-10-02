"use client";

import { Eye, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { MediaThumb } from "@/components/media/PhotoUploader";
import { VoicePlayer } from "@/components/media/VoicePlayer";
import { useT } from "@/components/providers/LangProvider";
import { MediaImage } from "@/components/ui/MediaImage";
import { Button } from "@/components/ui/primitives";
import { audit } from "@/lib/db/actions";
import { logisticsOverlay } from "@/lib/db/actions-admin-core";
import { useDb } from "@/lib/db/store";
import { conditionLabel, sourceLabel, warrantyLabel } from "@/lib/labels";
import type { Claim, OrderItem, VendorOrder } from "@/lib/types";
import { KV, Panel } from "../index";

function Col({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-line p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{title}</p>
      {children}
    </div>
  );
}

const Empty = ({ text }: { text: string }) => <p className="grid aspect-video place-items-center rounded-lg bg-surface text-sm text-muted">{text}</p>;

/** Listing claims | packing photo | QC | customer evidence (file 03 §11). */
export function EvidencePanel({ claim, vo, item }: { claim: Claim; vo: VendorOrder; item: OrderItem }) {
  const { tx, L, lang } = useT();
  const listing = useDb((s) => s.listings.find((l) => l.id === item.listing_id) ?? null);
  const qc = logisticsOverlay.useStore((o) => o.qc[vo.id] ?? null);
  const snap = item.snapshot;
  return (
    <Panel title={tx("প্রমাণ পাশাপাশি", "Evidence side by side")}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Col title={tx("লিস্টিং: ছবি ও দাবি", "Listing: photos & claims")}>
          <div className="mb-2 flex gap-2 overflow-x-auto">
            {(listing?.media ?? [{ url: snap.image }]).map((m, i) => (
              <MediaImage key={i} src={m.url} alt={snap.title} className="size-20 shrink-0 rounded-lg" />
            ))}
          </div>
          <KV
            rows={[
              [tx("উৎস", "Source"), L(sourceLabel[snap.source])],
              [tx("অবস্থা", "Condition"), `${L(conditionLabel[snap.condition])}${snap.grade ? ` · ${snap.grade}` : ""}`],
              [tx("পার্ট নম্বর", "Part no."), listing?.part_number ?? "—"],
              [tx("ওয়ারেন্টি", "Warranty"), warrantyLabel(snap.warranty_days, lang)],
              [tx("ফেরত", "Returns"), snap.is_returnable ? tx("ফেরতযোগ্য", "Returnable") : tx("ফেরত নয়", "Not returnable")],
            ]}
          />
        </Col>
        <Col title={tx("বিক্রেতার প্যাকিং ছবি", "Seller packing photo")}>
          {vo.packing_photo ? <MediaImage src={vo.packing_photo} alt="packing" className="aspect-video w-full rounded-lg" /> : <Empty text={tx("প্যাকিং ছবি নেই", "No packing photo")} />}
        </Col>
        <Col title={tx("QC ছবি", "QC photos")}>
          {qc?.photos.length ? (
            <div className="flex gap-2 overflow-x-auto">
              {qc.photos.map((p, i) => <MediaImage key={i} src={p} alt="qc" className="size-20 shrink-0 rounded-lg" />)}
            </div>
          ) : vo.qc ? (
            <MediaImage src="ph:shield" alt="qc" className="aspect-video w-full rounded-lg" />
          ) : (
            <Empty text={tx("QC হয়নি (Assured নয়)", "No QC (not Assured)")} />
          )}
          {vo.qc && <p className="mt-2 text-sm">{vo.qc.result === "pass" ? "✅" : "❌"} {vo.qc.note}</p>}
        </Col>
        <Col title={tx("কাস্টমারের প্রমাণ", "Customer evidence")}>
          <div className="mb-2 flex flex-wrap gap-2">
            {claim.media.map((m) => <MediaThumb key={m.id} item={m} />)}
            {!claim.media.length && <Empty text={tx("ছবি/ভিডিও নেই", "No photos/video")} />}
          </div>
          {claim.voice_notes.map((v) => (
            <div key={v.id} className="mb-2">
              <VoicePlayer src={v.url} duration={v.duration_sec} />
            </div>
          ))}
        </Col>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs font-bold text-muted">{tx("কাস্টমারের বক্তব্য", "Customer's statement")}</p>
          <p className="mt-1">{claim.description ?? tx("(লেখা নেই, ভয়েস শুনুন)", "(no text, listen to voice)")}</p>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs font-bold text-muted">{tx("দোকানের বক্তব্য", "Seller's statement")}</p>
          <p className="mt-1">{claim.vendor_response ?? tx("দোকান এখনো উত্তর দেয়নি", "Seller hasn't replied yet")}</p>
        </div>
      </div>
      <ChatEvidence claim={claim} />
    </Panel>
  );
}

/** Customer–seller chat is private: shown only as dispute evidence, and every view is audited. */
function ChatEvidence({ claim }: { claim: Claim }) {
  const { tx, dateTime } = useT();
  const [show, setShow] = useState(false);
  const thread = useDb((s) => s.threads.find((t) => t.type === "customer_vendor" && t.customer_phone === claim.user_phone && t.vendor_id === claim.vendor_id) ?? null);
  if (!thread) return <p className="mt-3 text-sm text-muted">{tx("দুই পক্ষের মধ্যে কোনো চ্যাট নেই।", "No chat between the two parties.")}</p>;
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {!show && (
          <Button size="sm" variant="outline" onClick={() => { setShow(true); audit("চ্যাট দেখা (বিরোধের প্রমাণ)", `${claim.claim_no} · ${thread.id}`); }}>
            <Eye className="size-4" /> {tx("চ্যাট ইতিহাস দেখুন (অডিট লগে যাবে)", "View chat history (audited)")}
          </Button>
        )}
        <Link href="/admin/messages" className="inline-flex min-h-9 items-center gap-1.5 px-2 text-sm font-semibold text-brand hover:underline">
          <MessagesSquare className="size-4" /> {tx("মেসেজ মনিটর", "Message monitor")}
        </Link>
      </div>
      {show && (
        <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-line p-3 text-sm">
          {thread.messages.map((m) => (
            <li key={m.id} className={m.sender === "system" ? "text-center text-xs text-muted" : m.contains_contact_info ? "rounded-lg bg-bad-soft px-2 py-1" : ""}>
              {m.sender !== "system" && <b>{m.sender === "customer" ? tx("কাস্টমার", "Customer") : m.sender === "vendor" ? tx("দোকান", "Seller") : tx("সাপোর্ট", "Support")}: </b>}
              {m.body ?? (m.type === "voice" ? "🎤" : m.type)} <span className="text-xs text-muted">· {dateTime(m.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
