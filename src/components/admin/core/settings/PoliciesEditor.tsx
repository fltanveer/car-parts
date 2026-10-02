"use client";

import clsx from "clsx";
import { History, Save } from "lucide-react";
import { useState } from "react";
import { SpeakButton } from "@/components/layout/AudioGuide";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Textarea } from "@/components/ui/primitives";
import { iso } from "@/lib/db/seed";
import { getDb, useDb } from "@/lib/db/store";
import { Panel } from "../Panel";
import { staffName } from "../system/permissions";
import { policiesOverlay, savePolicyVersion } from "./overlay";
import { policyMeta, type PolicyKey } from "./policyDefaults";
import { AgreementReaccept } from "./AgreementReaccept";

export function PoliciesEditor({ canEdit }: { canEdit: boolean }) {
  const { tx, d, dateTime } = useT();
  const [key, setKey] = useState<PolicyKey>("return");
  const versions = policiesOverlay.useStore((o) => o.versions[key] ?? []);
  const staff = useDb((s) => s.staff);
  const [viewV, setViewV] = useState<number | null>(null);
  const meta = policyMeta.find((m) => m.key === key)!;
  const current = versions[0];
  const shown = versions.find((v) => v.v === viewV) ?? current;

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <nav aria-label={tx("পলিসি", "Policies")} className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {policyMeta.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => { setKey(m.key); setViewV(null); }}
            aria-pressed={key === m.key}
            className={clsx("flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-3 text-left font-semibold", key === m.key ? "bg-ink text-white" : "bg-card ring-1 ring-line hover:ring-ink/30")}
          >
            <span aria-hidden>{m.icon}</span>
            <span className="flex-1">{tx(m.bn, m.en)}</span>
          </button>
        ))}
      </nav>

      <div className="min-w-0 space-y-4">
        <Panel
          title={<>{meta.icon} {tx(meta.bn, meta.en)} · v{d(shown?.v ?? 1)}</>}
          actions={shown && <SpeakButton text={shown.text} label={tx("শুনুন", "Listen")} />}
        >
          {shown && shown.v !== current?.v && (
            <p className="mb-2 rounded-lg bg-wait-soft px-3 py-1.5 text-sm font-semibold text-wait">
              {tx("পুরনো সংস্করণ দেখছেন", "Viewing an older version")} ·{" "}
              <button type="button" className="underline" onClick={() => setViewV(null)}>{tx("বর্তমানটা দেখুন", "Show current")}</button>
            </p>
          )}
          <div className="whitespace-pre-line rounded-xl bg-surface p-4 leading-relaxed" lang="bn">{shown?.text}</div>
          <p className="mt-2 text-xs text-muted">
            {shown && `${dateTime(shown.at)} · ${staffName(staff, shown.by)}`}
          </p>
        </Panel>

        {canEdit && current && <PolicyEdit key={`${key}:${current.v}`} policy={key} text={current.text} label={tx(meta.bn, meta.en)} />}

        <Panel title={<><History className="inline size-4" aria-hidden /> {tx("সংস্করণের ইতিহাস", "Version history")}</>}>
          <ul className="divide-y divide-line">
            {versions.map((v, i) => (
              <li key={v.v} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-bold">v{d(v.v)}</span>
                  {i === 0 && <span className="ml-2 rounded-full bg-ok-soft px-2 py-0.5 text-xs font-bold text-ok">{tx("চালু", "Live")}</span>}
                  <span className="ml-2 text-sm text-muted">{dateTime(v.at)} · {staffName(staff, v.by)}</span>
                </span>
                <Button size="sm" variant="ghost" onClick={() => setViewV(v.v)}>{tx("দেখুন", "View")}</Button>
              </li>
            ))}
          </ul>
        </Panel>

        {key === "seller_agreement" && <AgreementReaccept canEdit={canEdit} version={current?.v ?? 1} />}
      </div>
    </div>
  );
}

function PolicyEdit({ policy, text, label }: { policy: PolicyKey; text: string; label: string }) {
  const { tx } = useT();
  const [draft, setDraft] = useState(text);
  const dirty = draft.trim() !== text.trim();
  const save = () => {
    if (!draft.trim()) return toast(tx("লেখা খালি রাখা যাবে না", "Text cannot be empty"), "bad");
    const v = savePolicyVersion(policy, draft.trim(), getDb().session.staffId ?? "system", iso());
    toast(tx(`${label}: নতুন সংস্করণ v${v} চালু`, `${label}: version ${v} is live`));
  };
  return (
    <Panel title={tx("সম্পাদনা (সেভ করলে নতুন সংস্করণ হবে)", "Edit (saving creates a new version)")}>
      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={8} lang="bn" aria-label={label} />
      <p className="mt-1 text-xs text-muted">{tx("সহজ বাংলায়, ছোট বাক্যে লিখুন। প্রতিটা লাইন আলাদা নিয়ম।", "Use plain Bangla and short sentences. One rule per line.")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="ok" size="lg" onClick={save} disabled={!dirty}>
          <Save className="size-5" aria-hidden /> {tx("নতুন সংস্করণ সেভ", "Save new version")}
        </Button>
        {dirty && <Button variant="ghost" onClick={() => setDraft(text)}>{tx("বাতিল", "Discard")}</Button>}
        <SpeakButton text={draft} label={tx("খসড়া শুনুন", "Listen to draft")} />
      </div>
    </Panel>
  );
}
