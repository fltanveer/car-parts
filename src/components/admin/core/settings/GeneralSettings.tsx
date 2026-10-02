"use client";

import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Chip, Notice, Toggle } from "@/components/ui/primitives";
import { setAdminSetting, useAdminSettings } from "@/lib/db/actions-admin-core";
import { settings as defaults } from "@/lib/mock/settings";
import { Panel } from "../Panel";
import { FLAGS, SETTING_GROUPS } from "./fields";
import { SettingField } from "./SettingField";

/** All `settings` values grouped (file 00 §12.13, file 03 §21). */
export function GeneralSettings({ canEdit }: { canEdit: boolean }) {
  const { tx, d } = useT();
  const all = useAdminSettings();
  const [group, setGroup] = useState<string>("all");
  const changedCount = SETTING_GROUPS.flatMap((g) => g.fields).filter((f) => JSON.stringify(all[f.k]) !== JSON.stringify(defaults[f.k])).length;
  const groups = group === "all" ? SETTING_GROUPS : SETTING_GROUPS.filter((g) => g.id === group);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={group === "all"} onClick={() => setGroup("all")}>{tx("সব", "All")}</Chip>
        {SETTING_GROUPS.map((g) => (
          <Chip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
            <span aria-hidden>{g.icon}</span> {tx(g.bn, g.en)}
          </Chip>
        ))}
        <Chip active={group === "flags"} onClick={() => setGroup("flags")}>🚩 {tx("মডিউল চালু/বন্ধ", "Feature flags")}</Chip>
      </div>
      {changedCount > 0 && (
        <Notice tone="wait">
          {tx(`${d(changedCount)}টা সেটিং ডিফল্ট থেকে বদলানো (হলুদ দাগ দেওয়া)।`, `${changedCount} settings differ from default (marked yellow).`)}
        </Notice>
      )}

      {group !== "flags" &&
        groups.map((g) => (
          <Panel key={g.id} id={g.id} title={<><span aria-hidden>{g.icon}</span> {tx(g.bn, g.en)}</>}>
            <div className="grid gap-3 lg:grid-cols-2">
              {g.fields.map((f) => (
                <SettingField key={f.k} def={f} canEdit={canEdit} />
              ))}
            </div>
          </Panel>
        ))}

      {(group === "all" || group === "flags") && (
        <Panel id="flags" title={<>🚩 {tx("মডিউল চালু/বন্ধ (ফিচার ফ্ল্যাগ)", "Modules on/off (feature flags)")}</>}>
          <div className="grid gap-x-6 sm:grid-cols-2">
            {FLAGS.map((f) => {
              const on = all.feature_flags[f.k];
              const changed = on !== defaults.feature_flags[f.k];
              return (
                <div key={f.k} className="border-b border-line py-1 last:border-0">
                  <Toggle
                    checked={on}
                    label={
                      <span>
                        {tx(f.bn, f.en)}
                        {changed && <span className="ml-2 text-xs font-bold text-wait">● {tx("বদলানো", "Changed")}</span>}
                        <span className="block text-xs font-normal text-muted">{tx(f.desc_bn, f.desc_en)}</span>
                      </span>
                    }
                    onChange={(v) => {
                      if (!canEdit) return toast(tx("শুধু সুপার অ্যাডমিন বদলাতে পারেন", "Only a super admin can change this"), "bad");
                      setAdminSetting("feature_flags", { ...all.feature_flags, [f.k]: v });
                      toast(tx(`${f.bn}: ${v ? "চালু" : "বন্ধ"}`, `${f.en}: ${v ? "on" : "off"}`));
                    }}
                  />
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </>
  );
}
