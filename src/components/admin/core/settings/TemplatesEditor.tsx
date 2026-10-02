"use client";

import clsx from "clsx";
import { Save } from "lucide-react";
import { useRef, useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, StatusPill, Tabs, Textarea, Toggle } from "@/components/ui/primitives";
import { Panel } from "../Panel";
import { saveTemplate, templatesOverlay } from "./overlay";
import { fillVars, smsSegments, type MsgTemplate } from "./templateDefaults";

export function TemplatesEditor({ canEdit }: { canEdit: boolean }) {
  const { tx, d } = useT();
  const templates = templatesOverlay.useStore((o) => o.templates);
  const [aud, setAud] = useState<MsgTemplate["audience"]>("customer");
  const list = templates.filter((t) => t.audience === aud);
  const [selId, setSelId] = useState<string | null>(null);
  const sel = list.find((t) => t.id === selId) ?? list[0];

  return (
    <>
      <Tabs
        value={aud}
        onChange={(v) => { setAud(v); setSelId(null); }}
        items={[
          { value: "customer", label: tx("কাস্টমার", "Customer") },
          { value: "vendor", label: tx("বিক্রেতা", "Seller") },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <ul className="space-y-2">
          {list.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelId(t.id)}
                aria-pressed={sel?.id === t.id}
                className={clsx("flex min-h-14 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left", sel?.id === t.id ? "bg-ink text-white" : "bg-card ring-1 ring-line hover:ring-ink/30")}
              >
                <span className="font-semibold">{tx(t.name_bn, t.name_en)}</span>
                <span className="flex items-center gap-1 text-xs">
                  {d(smsSegments(t.body).segments)} SMS
                  {!t.enabled && <StatusPill tone="bad">{tx("বন্ধ", "Off")}</StatusPill>}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {sel && <TemplateForm key={`${sel.id}:${sel.body}:${sel.enabled}`} t={sel} canEdit={canEdit} />}
      </div>
    </>
  );
}

function TemplateForm({ t, canEdit }: { t: MsgTemplate; canEdit: boolean }) {
  const { tx, d } = useT();
  const [body, setBody] = useState(t.body);
  const ref = useRef<HTMLTextAreaElement>(null);
  const seg = smsSegments(body);
  const preview = fillVars(body);
  const segPreview = smsSegments(preview);
  const unknown = Array.from(body.matchAll(/\{(\w+)\}/g)).map((m) => m[1]).filter((k) => !t.vars.includes(k));

  const insert = (v: string) => {
    const el = ref.current;
    const tag = `{${v}}`;
    if (!el) return setBody((b) => b + tag);
    const a = el.selectionStart ?? body.length;
    const b = el.selectionEnd ?? body.length;
    const next = body.slice(0, a) + tag + body.slice(b);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + tag.length, a + tag.length);
    });
  };

  const save = () => {
    if (!body.trim()) return toast(tx("লেখা খালি রাখা যাবে না", "Body cannot be empty"), "bad");
    if (unknown.length) return toast(tx(`অজানা ভেরিয়েবল: ${unknown.join(", ")}`, `Unknown variables: ${unknown.join(", ")}`), "bad");
    saveTemplate(t.id, { body: body.trim() }, "সম্পাদনা");
    toast(tx("টেমপ্লেট সেভ হয়েছে", "Template saved"));
  };

  return (
    <div className="min-w-0 space-y-4">
      <Panel
        title={tx(t.name_bn, t.name_en)}
        actions={
          <div className="w-40">
            <Toggle
              checked={t.enabled}
              label={t.enabled ? tx("চালু", "On") : tx("বন্ধ", "Off")}
              onChange={(v) => {
                if (!canEdit) return toast(tx("শুধু সুপার অ্যাডমিন", "Super admin only"), "bad");
                saveTemplate(t.id, { enabled: v }, v ? "চালু" : "বন্ধ");
                toast(v ? tx("চালু হয়েছে", "Enabled") : tx("বন্ধ হয়েছে", "Disabled"), "info");
              }}
            />
          </div>
        }
      >
        <p className="mb-2 text-sm font-semibold">{tx("ভেরিয়েবল (চাপ দিলে লেখায় বসবে)", "Variables (tap to insert)")}</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {t.vars.map((v) => (
            <button key={v} type="button" disabled={!canEdit} onClick={() => insert(v)} className="min-h-9 rounded-full bg-brand-soft px-3 font-mono text-sm font-semibold text-brand-ink hover:brightness-95 disabled:opacity-50">
              {`{${v}}`}
            </button>
          ))}
        </div>
        <Textarea ref={ref} value={body} onChange={(e) => setBody(e.target.value)} disabled={!canEdit} rows={4} aria-label={tx("টেমপ্লেট লেখা", "Template body")} />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <span className={clsx("font-semibold", seg.segments > 2 ? "text-bad" : seg.segments > 1 ? "text-wait" : "text-ok")}>
            {d(seg.len)} {tx("অক্ষর", "chars")} · {d(seg.segments)} SMS
          </span>
          <span className="text-muted">
            {seg.ucs ? tx("বাংলা (UCS-2): ৭০ অক্ষর/SMS, একাধিক হলে ৬৭", "Unicode (UCS-2): 70 chars/SMS, 67 when split") : tx("ইংরেজি (GSM): ১৬০ অক্ষর/SMS", "GSM: 160 chars/SMS")}
          </span>
        </div>
        {unknown.length > 0 && <p className="mt-1 text-sm font-semibold text-bad">{tx("অজানা ভেরিয়েবল", "Unknown variables")}: {unknown.join(", ")}</p>}
        {canEdit && (
          <div className="mt-3 flex gap-2">
            <Button variant="ok" size="lg" onClick={save} disabled={body === t.body}>
              <Save className="size-5" aria-hidden /> {tx("সেভ", "Save")}
            </Button>
            {body !== t.body && <Button variant="ghost" onClick={() => setBody(t.body)}>{tx("বাতিল", "Discard")}</Button>}
          </div>
        )}
      </Panel>
      <Panel title={tx("প্রিভিউ (নমুনা মান দিয়ে)", "Preview (sample values)")}>
        <div className="max-w-sm rounded-2xl rounded-bl-sm bg-surface p-4 text-sm leading-relaxed shadow-inner">{preview}</div>
        <p className="mt-2 text-xs text-muted">
          {tx("আসল মান বসানোর পর", "With real values")}: {d(segPreview.len)} {tx("অক্ষর", "chars")} · {d(segPreview.segments)} SMS
        </p>
      </Panel>
    </div>
  );
}
