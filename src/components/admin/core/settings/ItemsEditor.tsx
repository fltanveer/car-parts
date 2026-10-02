"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Input, Notice, StatusPill, Toggle } from "@/components/ui/primitives";
import { setAdminSetting, useAdminSettings } from "@/lib/db/actions-admin-core";
import { uid } from "@/lib/db/seed";
import { Panel } from "../Panel";
import { addItemRule, itemsOverlay, toggleItemRule } from "./overlay";

const RULE_KINDS: [string, string][] = [["নিষিদ্ধ", "Prohibited"], ["অ্যাডমিন যাচাই", "Admin check"], ["শুধু অনুমোদিত বিক্রেতা", "Approved sellers only"]];

/** Prohibited / restricted items (file 04 §10). */
export function ItemsEditor({ canEdit }: { canEdit: boolean }) {
  const { tx } = useT();
  const rules = itemsOverlay.useStore((o) => o.rules);
  const s = useAdminSettings();
  const [bn, setBn] = useState("");
  const [kind, setKind] = useState(0);

  const deny = () => toast(tx("শুধু সুপার অ্যাডমিন বদলাতে পারেন", "Only a super admin can change this"), "bad");

  return (
    <>
      <Panel title={tx("পুরনো এয়ারব্যাগ (ডিপ্লয় না হওয়া)", "Used airbags (not deployed)")}>
        <Toggle
          size="lg"
          checked={s.used_airbag_allowed}
          label={s.used_airbag_allowed ? tx("বিক্রি করা যাবে (মডারেশনে যাবে)", "Allowed (goes to moderation)") : tx("বিক্রি বন্ধ", "Not allowed")}
          onChange={(v) => {
            if (!canEdit) return deny();
            setAdminSetting("used_airbag_allowed", v);
            toast(v ? tx("পুরনো এয়ারব্যাগ চালু", "Used airbags allowed") : tx("পুরনো এয়ারব্যাগ বন্ধ", "Used airbags blocked"), "info");
          }}
        />
        <p className="text-sm text-muted">{tx("ডিপ্লয় হওয়া এয়ারব্যাগ সবসময় নিষিদ্ধ।", "Deployed airbags are always prohibited.")}</p>
      </Panel>

      <Panel title={tx("নিষিদ্ধ ও সীমিত জিনিসের তালিকা", "Prohibited & restricted items")}>
        <Notice tone="info" className="mb-3">
          {tx("চালু নিয়ম বিক্রেতার পণ্য যোগ করার সময় আটকায় বা মডারেশনে পাঠায়। বন্ধ করলে আর আটকাবে না।", "Enforced rules block uploads or send them to moderation. Turning one off stops enforcement.")}
        </Notice>
        <ul className="divide-y divide-line">
          {rules.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{tx(r.bn, r.en)}</span>
                <StatusPill tone={r.rule_en === "Prohibited" ? "bad" : "wait"}>{tx(r.rule_bn, r.rule_en)}</StatusPill>
              </span>
              <span className="w-44">
                <Toggle
                  checked={r.enforced}
                  label={r.enforced ? tx("চালু", "Enforced") : tx("বন্ধ", "Off")}
                  onChange={(v) => {
                    if (!canEdit) return deny();
                    toggleItemRule(r.id, v);
                    toast(tx(`${r.bn}: ${v ? "চালু" : "বন্ধ"}`, `${r.en}: ${v ? "enforced" : "off"}`), "info");
                  }}
                />
              </span>
            </li>
          ))}
        </ul>
        {canEdit && (
          <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
            <Input value={bn} onChange={(e) => setBn(e.target.value)} placeholder={tx("জিনিসের নাম (যেমন: নকল লোগো)", "Item (e.g. fake logos)")} className="max-w-sm" />
            <select value={kind} onChange={(e) => setKind(Number(e.target.value))} aria-label={tx("নিয়ম", "Rule")} className="min-h-12 rounded-xl border-2 border-line bg-card px-3">
              {RULE_KINDS.map((k, i) => (
                <option key={i} value={i}>{tx(...k)}</option>
              ))}
            </select>
            <Button
              variant="brand"
              onClick={() => {
                if (!bn.trim()) return toast(tx("নাম লিখুন", "Enter a name"), "bad");
                addItemRule({ id: `pr-${uid()}`, bn: bn.trim(), en: bn.trim(), rule_bn: RULE_KINDS[kind][0], rule_en: RULE_KINDS[kind][1], enforced: true });
                setBn("");
                toast(tx("যোগ হয়েছে", "Added"));
              }}
            >
              <Plus className="size-4" aria-hidden /> {tx("যোগ করুন", "Add")}
            </Button>
          </div>
        )}
      </Panel>
      <Notice tone="wait">
        {tx("চুরি ঠেকাতে: একই বিক্রেতা অস্বাভাবিক সংখ্যায় সাইড মিরর/লাইট/লোগো দিলে মডারেশনে ফ্ল্যাগ হয়।", "Anti-theft: unusual volumes of mirrors/lights/logos from one seller are flagged to moderation.")}
      </Notice>
    </>
  );
}
