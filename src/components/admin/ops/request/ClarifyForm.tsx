"use client";

import clsx from "clsx";
import { BookPlus, Save, Wand2 } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { MediaThumb } from "@/components/media/PhotoUploader";
import { toast } from "@/components/shared/Misc";
import { Button, Field, Input, Notice, Textarea } from "@/components/ui/primitives";
import { addDictionaryWord, saveClarifyDraft, saveVehicleToCustomer, setPhotoHidden, useOps } from "@/lib/db/actions-admin-ops";
import { containsPersonalInfo } from "@/lib/rules";
import type { PartRequest } from "@/lib/types";
import { Dictate } from "../Dictate";
import { FilterChips, Panel } from "../ui";
import { autoSummary, draftPatch, type ClarifyDraft } from "./draft";
import { ItemsEditor, VehicleField } from "./Editors";

/** MIDDLE column: the clarify note (request_reviews). */
export function ClarifyForm({ r, draft, setDraft }: { r: PartRequest; draft: ClarifyDraft; setDraft: (d: ClarifyDraft) => void }) {
  const { tx } = useT();
  const hidden = useOps((s) => s.hiddenPhotos[r.id] ?? []);
  const [heard, setHeard] = useState("");
  const [means, setMeans] = useState("");
  const pii = draft.summary ? containsPersonalInfo(draft.summary) || draft.summary.includes(r.user_phone.slice(-8)) : false;

  return (
    <Panel title={tx("পরিষ্কার নোট", "Clarify note")}>
      <div className="space-y-5">
        <div>
          <p className="mb-1.5 font-semibold">{tx("বোঝা গেছে?", "Understood?")}</p>
          <FilterChips<ClarifyDraft["clarity"]>
            value={draft.clarity}
            onChange={(clarity) => setDraft({ ...draft, clarity })}
            items={[
              { value: "clear", label: tx("✅ পরিষ্কার", "✅ Clear") },
              { value: "partly", label: tx("🟡 আংশিক", "🟡 Partly") },
              { value: "need_call", label: tx("📞 কল করতে হবে", "📞 Need a call") },
            ]}
          />
        </div>

        <div>
          <p className="mb-1.5 font-semibold">{tx("গাড়ি", "Car")}</p>
          <VehicleField
            generationId={draft.generation_id}
            engineId={draft.engine_id}
            onChange={(g, e) => setDraft({ ...draft, generation_id: g, engine_id: e })}
            extra={
              draft.generation_id && draft.generation_id !== r.generation_id ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => {
                    saveVehicleToCustomer(r.id, draft.generation_id!, draft.engine_id);
                    toast(tx("কাস্টমারের গাড়িতে সেভ হয়েছে", "Saved to the customer's car"));
                  }}
                >
                  💾 {tx("কাস্টমারের গাড়িতে সেভ করুন", "Save to customer's car")}
                </Button>
              ) : null
            }
          />
        </div>

        <div>
          <p className="mb-1.5 font-semibold">{tx("আইটেম", "Items")}</p>
          <ItemsEditor items={draft.items} onChange={(items) => setDraft({ ...draft, items })} />
        </div>

        <Field label={tx("বিক্রেতারা যা দেখবে (সারাংশ)", "What sellers will see (summary)")} hint={tx("কাস্টমারের নাম, নম্বর, ঠিকানা লিখবেন না।", "Never include the customer's name, number or address.")}>
          <Textarea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} className={clsx(pii && "border-bad")} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setDraft({ ...draft, summary: autoSummary(draft) })}>
            <Wand2 className="size-4" /> {tx("স্বয়ংক্রিয় সারাংশ", "Auto summary")}
          </Button>
          <Dictate onText={(t) => setDraft({ ...draft, summary: draft.summary ? `${draft.summary} ${t}` : t })} />
        </div>
        {pii && <Notice tone="bad">⚠️ {tx("সারাংশে ফোন নম্বর/ঠিকানা/লিংক আছে মনে হচ্ছে। সরিয়ে দিন, বিক্রেতারা এটা দেখবে।", "The summary seems to contain a phone/address/link. Remove it — sellers see this.")}</Notice>}

        {r.photos.length > 0 && (
          <div>
            <p className="mb-1.5 font-semibold">{tx("কোন ছবি বিক্রেতারা দেখবে", "Photos sellers may see")}</p>
            <div className="flex flex-wrap gap-3">
              {r.photos.map((p) => {
                const isHidden = hidden.includes(p.id);
                return (
                  <label key={p.id} className="flex cursor-pointer flex-col items-center gap-1 text-xs">
                    <span className={clsx(isHidden && "opacity-40 blur-[2px]")}>
                      <MediaThumb item={p} />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <input type="checkbox" className="size-4" checked={!isHidden} onChange={(e) => setPhotoHidden(r.id, p.id, !e.target.checked)} />
                      {isHidden ? tx("লুকানো", "Hidden") : tx("দেখাবে", "Shown")}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-muted">{tx("মুখ বা নম্বর প্লেট দেখা গেলে ছবিটা লুকান।", "Hide photos that show faces or number plates.")}</p>
          </div>
        )}

        <div className="rounded-xl bg-surface p-3">
          <p className="mb-2 flex items-center gap-1.5 font-semibold">
            <BookPlus className="size-4" /> {tx("আঞ্চলিক শব্দ → শব্দভাণ্ডারে যোগ", "Regional word → add to dictionary")}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={heard} onChange={(e) => setHeard(e.target.value)} placeholder={tx("কাস্টমার বলেছে (যেমন: চাক্কি)", "Customer said")} className="min-h-10" />
            <Input value={means} onChange={(e) => setMeans(e.target.value)} placeholder={tx("আসলে মানে (যেমন: ক্লাচ প্লেট)", "Actually means")} className="min-h-10" />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            disabled={!heard.trim() || !means.trim()}
            onClick={() => {
              addDictionaryWord({ heard: heard.trim(), means: means.trim(), category_id: draft.items[0]?.category_id ?? null, request_id: r.id });
              setHeard("");
              setMeans("");
              toast(tx("শব্দভাণ্ডারে যোগ হয়েছে", "Added to dictionary"));
            }}
          >
            {tx("যোগ করুন", "Add")}
          </Button>
        </div>

        <Button
          variant="outline"
          full
          onClick={() => {
            saveClarifyDraft(r.id, draftPatch(draft));
            toast(tx("নোট সেভ হয়েছে", "Note saved"));
          }}
        >
          <Save className="size-4" /> {tx("পাঠানো ছাড়া সেভ করুন", "Save without sending")}
        </Button>
      </div>
    </Panel>
  );
}
