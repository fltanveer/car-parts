"use client";

import { Mic, Trash2 } from "lucide-react";
import { useState } from "react";
import { VoicePlayer } from "@/components/media/VoicePlayer";
import { VoiceRecorder } from "@/components/media/VoiceRecorder";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Chip, StatusPill } from "@/components/ui/primitives";
import { iso } from "@/lib/db/seed";
import { getDb, useDb } from "@/lib/db/store";
import { Panel } from "../Panel";
import { staffName } from "../system/permissions";
import { audioOverlay, setAudioFile } from "./overlay";

type Panel3 = "customer" | "seller" | "admin";
const SCREENS: { id: string; panel: Panel3; bn: string; en: string }[] = [
  { id: "c-home", panel: "customer", bn: "হোম", en: "Home" },
  { id: "c-request-new", panel: "customer", bn: "পার্ট চাই (রিকোয়েস্ট)", en: "Request a part" },
  { id: "c-compare", panel: "customer", bn: "দাম তুলনা", en: "Compare quotes" },
  { id: "c-checkout", panel: "customer", bn: "চেকআউট ও পেমেন্ট", en: "Checkout & payment" },
  { id: "c-claim", panel: "customer", bn: "সমস্যা জানান (দাবি)", en: "Report a problem" },
  { id: "c-garage", panel: "customer", bn: "আমার গাড়ি", en: "My garage" },
  { id: "s-join", panel: "seller", bn: "বিক্রেতা হোন", en: "Become a seller" },
  { id: "s-home", panel: "seller", bn: "আজ (হোম)", en: "Today (home)" },
  { id: "s-add-camera", panel: "seller", bn: "ছবি তুলে পণ্য যোগ", en: "Add by camera" },
  { id: "s-quote", panel: "seller", bn: "দাম দেওয়া", en: "Give a quote" },
  { id: "s-orders", panel: "seller", bn: "অর্ডার ও প্যাকিং", en: "Orders & packing" },
  { id: "s-money", panel: "seller", bn: "টাকা ও পেআউট", en: "Money & payouts" },
  { id: "s-agreement", panel: "seller", bn: "বিক্রেতা চুক্তি", en: "Seller agreement" },
  { id: "a-field", panel: "admin", bn: "মাঠকর্মী মোবাইল ভিউ", en: "Field agent view" },
  { id: "a-rider", panel: "admin", bn: "রাইডার ভিউ", en: "Rider view" },
];

/** Pre-recorded 🔊 audio per screen (file 03 §21); falls back to browser speech. */
export function AudioFiles({ canEdit }: { canEdit: boolean }) {
  const { tx, d, dateTime } = useT();
  const files = audioOverlay.useStore((o) => o.files);
  const staff = useDb((s) => s.staff);
  const [panel, setPanel] = useState<Panel3>("customer");
  const [recording, setRecording] = useState<string | null>(null);
  const list = SCREENS.filter((s) => s.panel === panel);
  const done = SCREENS.filter((s) => files[s.id]).length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={panel === "customer"} onClick={() => setPanel("customer")}>{tx("কাস্টমার অ্যাপ", "Customer app")}</Chip>
        <Chip active={panel === "seller"} onClick={() => setPanel("seller")}>{tx("বিক্রেতা প্যানেল", "Seller panel")}</Chip>
        <Chip active={panel === "admin"} onClick={() => setPanel("admin")}>{tx("মাঠ/রাইডার", "Field/rider")}</Chip>
        <span className="ml-auto text-sm font-semibold text-muted">{tx(`${d(done)}/${d(SCREENS.length)} স্ক্রিনে রেকর্ড করা অডিও`, `${done}/${SCREENS.length} screens have recorded audio`)}</span>
      </div>
      <Panel title={tx("স্ক্রিন অনুযায়ী অডিও গাইড", "Audio guide per screen")}>
        <ul className="divide-y divide-line">
          {list.map((s) => {
            const f = files[s.id];
            return (
              <li key={s.id} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{tx(s.bn, s.en)}</span>
                    {f ? (
                      <span className="text-xs text-muted">{dateTime(f.at)} · {staffName(staff, f.by)}</span>
                    ) : (
                      <StatusPill tone="wait">{tx("রেকর্ড নেই: যন্ত্রের কণ্ঠে পড়বে", "No file: browser voice used")}</StatusPill>
                    )}
                  </span>
                  {f && <div className="w-56"><VoicePlayer src={f.url} duration={f.duration} /></div>}
                  {canEdit && (
                    <span className="flex gap-2">
                      <Button size="sm" variant={f ? "outline" : "brand"} onClick={() => setRecording(recording === s.id ? null : s.id)}>
                        <Mic className="size-4" aria-hidden /> {f ? tx("আবার রেকর্ড", "Re-record") : tx("রেকর্ড/আপলোড", "Record")}
                      </Button>
                      {f && (
                        <Button size="sm" variant="danger" aria-label={tx("মুছুন", "Delete")} onClick={() => { setAudioFile(s.id, null); toast(tx("মুছে ফেলা হয়েছে", "Deleted"), "info"); }}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </span>
                  )}
                </div>
                {recording === s.id && (
                  <div className="mt-3 rounded-xl bg-surface p-3">
                    <VoiceRecorder
                      compact
                      sendLabel={tx("এই স্ক্রিনে রাখুন", "Use for this screen")}
                      onSaved={(v) => {
                        setAudioFile(s.id, { url: v.url, duration: v.duration_sec, at: iso(), by: getDb().session.staffId ?? "system" });
                        setRecording(null);
                        toast(tx(`${s.bn}: অডিও সেভ হয়েছে`, `${s.en}: audio saved`));
                      }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
