"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Panel } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Chip, Field, Input, Select } from "@/components/ui/primitives";
import { type AdminCategory, type SynonymRow, addSynonym, pathLabel } from "./overlay";

export const REGIONS = ["ঢাকা", "চট্টগ্রাম", "সিলেট", "রাজশাহী", "খুলনা", "বরিশাল", "রংপুর", "ময়মনসিংহ"];

/** Add a synonym row: term → category or free keyword, optional dialect region. */
export function SynonymForm({ cats, rows }: { cats: AdminCategory[]; rows: SynonymRow[] }) {
  const { tx, lang } = useT();
  const [term, setTerm] = useState("");
  const [mode, setMode] = useState<"category" | "keyword">("category");
  const [cat, setCat] = useState("");
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");

  const t = term.trim();
  const dup = rows.some((r) => r.term.toLowerCase() === t.toLowerCase() && (mode === "category" ? r.category_id === cat : r.keyword === keyword.trim()));
  const valid = t && !dup && (mode === "category" ? !!cat : !!keyword.trim());

  return (
    <Panel title={tx("নতুন synonym যোগ", "Add synonym")}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={tx("শব্দ (যা মানুষ লেখে/বলে)", "Term (what people type/say)")} error={dup ? tx("এটা আগেই আছে", "Already exists") : undefined}>
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={tx("যেমন: শকার", "e.g. shocker")} />
        </Field>
        <Field label={tx("অঞ্চল / আঞ্চলিক ভাষা (ঐচ্ছিক)", "Region / dialect (optional)")}>
          <Select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">{tx("সব জায়গা", "Everywhere")}</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Chip active={mode === "category"} onClick={() => setMode("category")}>
          {tx("ক্যাটাগরিতে নিয়ে যাবে", "Maps to category")}
        </Chip>
        <Chip active={mode === "keyword"} onClick={() => setMode("keyword")}>
          {tx("কী-ওয়ার্ডে নিয়ে যাবে", "Maps to keyword")}
        </Chip>
      </div>
      <div className="mt-3">
        {mode === "category" ? (
          <Field label={tx("ক্যাটাগরি", "Category")}>
            <Select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">{tx("— বাছুন —", "— choose —")}</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {pathLabel(cats, c.id, lang)}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label={tx("কী-ওয়ার্ড (ইংরেজি সার্চ শব্দ)", "Keyword (search words)")}>
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="alternator" />
          </Field>
        )}
      </div>
      <Button
        size="lg"
        variant="brand"
        className="mt-4"
        disabled={!valid}
        onClick={() => {
          addSynonym({ term: t, category_id: mode === "category" ? cat : null, keyword: mode === "keyword" ? keyword.trim() : null, region: region || null, source: "admin" });
          toast(tx("synonym যোগ হয়েছে", "Synonym added"));
          setTerm("");
          setKeyword("");
        }}
      >
        <Plus className="size-5" /> {tx("যোগ করুন", "Add")}
      </Button>
    </Panel>
  );
}
