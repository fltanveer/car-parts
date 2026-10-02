"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { MediaImage } from "@/components/ui/MediaImage";
import { Button, Field, Input, Notice, StatusPill } from "@/components/ui/primitives";
import { audit } from "@/lib/db/actions";
import { completeGarageTask } from "@/lib/db/actions-admin-ops-trust";
import { useDb } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import { docTypeLabel } from "@/lib/labels";
import type { GarageDocTask, VehicleDocType } from "@/lib/types";
import { VehicleField } from "./request/Editors";
import { Panel } from "./ui";

const DOCS: VehicleDocType[] = ["registration", "tax_token", "fitness", "insurance", "route_permit", "driving_license"];

/** Set the car from papers / confirm OCR expiry dates (file 03 16). */
export function GarageTaskDetail({ task }: { task: GarageDocTask }) {
  const { tx, L, d } = useT();
  const vehicle = useDb((s) => s.vehicles.find((v) => v.id === task.user_vehicle_id) ?? null);
  const [revealed, setRevealed] = useState(false);
  const [gen, setGen] = useState<string | null>(vehicle?.generation_id ?? null);
  const [engine, setEngine] = useState<string | null>(vehicle?.engine_id ?? null);
  const [reg, setReg] = useState(vehicle?.registration_no ?? "");
  const [exp, setExp] = useState<Partial<Record<VehicleDocType, string>>>(() =>
    Object.fromEntries(DOCS.map((k) => [k, vehicle?.documents.find((x) => x.doc_type === k)?.expires_on?.slice(0, 10) ?? ""])),
  );
  const done = task.status === "done";
  const papers = vehicle?.papers_photo_url ?? vehicle?.documents.find((x) => x.doc_type === (task.doc_type ?? "registration"))?.file_url ?? "ph:doc";

  return (
    <div className="space-y-4">
      <Panel
        title={task.kind === "setup_from_papers" ? tx("কাগজ দেখে গাড়ি সেট", "Set car from papers") : tx("কাগজের মেয়াদ যাচাই", "Confirm document expiry")}
        action={<StatusPill tone={done ? "ok" : "wait"}>{done ? tx("সম্পন্ন", "Done") : tx("বাকি", "Open")}</StatusPill>}
      >
        <p className="text-sm">
          👤 <Link href={`/admin/customers/${encodeURIComponent(task.user_phone)}`} className="font-semibold text-brand">{d(displayPhone(task.user_phone))}</Link>
          {task.doc_type && <> · 📄 {L(docTypeLabel[task.doc_type])}</>}
        </p>
        {!vehicle && <Notice tone="wait" className="mt-2">{tx("গাড়ির রেকর্ড পাওয়া যায়নি; সেভ করলে নতুন রেকর্ড তৈরি হবে।", "Vehicle record missing; saving creates one.")}</Notice>}
        <div className="mt-3">
          {revealed ? (
            <MediaImage src={papers} alt={tx("কাগজের ছবি", "Papers photo")} className="aspect-[4/3] w-full max-w-md rounded-xl" />
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                audit("কাস্টমারের গাড়ির কাগজ দেখা", `${task.user_phone} · ${task.id}`);
                setRevealed(true);
              }}
            >
              🔒 {tx("কাগজের ছবি দেখুন (অডিট হবে)", "View papers (audited)")}
            </Button>
          )}
          <p className="mt-1 text-xs text-muted">{tx("কাস্টমারের কাগজ শুধু এই কাজে দেখা যাবে।", "Customer papers are viewed only for this task.")}</p>
        </div>
      </Panel>

      <Panel title={tx("গাড়ি ও রেজিস্ট্রেশন", "Car & registration")}>
        <div className="space-y-3">
          <VehicleField generationId={gen} engineId={engine} onChange={(g, e) => { setGen(g); setEngine(e); }} />
          <Field label={tx("রেজিস্ট্রেশন নম্বর", "Registration no.")}>
            <Input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="ঢাকা মেট্রো-গ ১২-৩৪৫৬" />
          </Field>
        </div>
      </Panel>

      <Panel title={tx("কাগজের মেয়াদ (OCR পড়া তারিখ যাচাই/সংশোধন)", "Expiry dates (check / fix OCR)")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {DOCS.filter((k) => k !== "registration").map((k) => (
            <Field key={k} label={L(docTypeLabel[k])}>
              <Input type="date" value={exp[k] ?? ""} onChange={(e) => setExp({ ...exp, [k]: e.target.value })} />
            </Field>
          ))}
        </div>
      </Panel>

      <Button
        variant="brand"
        size="xl"
        full
        disabled={done || (task.kind === "setup_from_papers" && !gen)}
        onClick={() => {
          completeGarageTask(task.id, { generation_id: gen, engine_id: engine, registration_no: reg.trim(), expiries: Object.fromEntries(Object.entries(exp).map(([k, v]) => [k, v || null])) });
          toast(tx("সেভ হয়েছে, কাস্টমারকে জানানো হয়েছে", "Saved, customer notified"));
        }}
      >
        {done ? tx("সম্পন্ন হয়েছে", "Completed") : tx("নিশ্চিত করে সেভ করুন", "Confirm & save")}
      </Button>
    </div>
  );
}
