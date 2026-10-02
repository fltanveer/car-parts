"use client";

import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { AdminPage, type Column, DataTable, FilterSelect, downloadCsv } from "@/components/admin/core";
import { DictionarySuggestions } from "@/components/admin/core/catalog/DictionarySuggestions";
import { type SynonymRow, type SynonymSource, deleteSynonym, pathLabel, useCategories, useSynonyms } from "@/components/admin/core/catalog/overlay";
import { SynonymForm } from "@/components/admin/core/catalog/SynonymForm";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, StatusPill } from "@/components/ui/primitives";

const SOURCE: Record<SynonymSource, { bn: string; en: string; tone: "info" | "ok" | "wait" }> = {
  category: { bn: "ক্যাটাগরি", en: "Category", tone: "info" },
  request_review: { bn: "রিকোয়েস্ট রিভিউ", en: "Request review", tone: "wait" },
  admin: { bn: "অ্যাডমিন", en: "Admin", tone: "ok" },
  search: { bn: "সার্চ", en: "Search", tone: "wait" },
};

export default function DictionaryPage() {
  const { tx, lang, L, d } = useT();
  const rows = useSynonyms();
  const cats = useCategories();
  const [source, setSource] = useState<"all" | SynonymSource>("all");
  const [confirm, setConfirm] = useState<string | null>(null);

  const target = (r: SynonymRow) => (r.category_id ? pathLabel(cats, r.category_id, lang) : r.keyword ?? "—");
  const shown = rows.filter((r) => source === "all" || r.source === source);

  const cols: Column<SynonymRow>[] = [
    { key: "term", header: tx("শব্দ", "Term"), sort: (r) => r.term, cell: (r) => <span className="font-semibold">{r.term}</span> },
    { key: "to", header: tx("কোথায় নিয়ে যায়", "Maps to"), sort: target, cell: (r) => (r.category_id ? <span className="text-xs">{target(r)}</span> : <code className="text-xs">🔑 {r.keyword}</code>) },
    { key: "region", header: tx("অঞ্চল", "Region"), sort: (r) => r.region ?? "", cell: (r) => r.region ?? <span className="text-muted">{tx("সব", "All")}</span>, hideOnMobile: true },
    { key: "source", header: tx("উৎস", "Source"), sort: (r) => r.source, cell: (r) => <StatusPill tone={SOURCE[r.source].tone}>{L(SOURCE[r.source])}</StatusPill> },
    { key: "uses", header: tx("ব্যবহার", "Uses"), sort: (r) => r.uses, cell: (r) => <span className="tabular-nums">{d(r.uses)}</span> },
    {
      key: "del",
      header: "",
      cell: (r) => (
        <Button
          size="sm"
          variant="danger"
          aria-label={tx("মুছুন", "Delete")}
          onClick={() => {
            if (confirm !== r.id) return setConfirm(r.id);
            deleteSynonym(r);
            setConfirm(null);
            toast(tx("মুছে ফেলা হয়েছে", "Deleted"));
          }}
        >
          <Trash2 className="size-4" /> {confirm === r.id ? tx("নিশ্চিত?", "Sure?") : ""}
        </Button>
      ),
    },
  ];

  const exportCsv = () =>
    downloadCsv("synonyms.csv", [["term", "category_id", "category_path", "keyword", "region", "source", "uses"], ...shown.map((r) => [r.term, r.category_id, r.category_id ? pathLabel(cats, r.category_id, "bn") : "", r.keyword, r.region, r.source, r.uses])]);

  return (
    <AdminPage
      back="/admin/catalog"
      title={tx("শব্দভাণ্ডার", "Dictionary")}
      subtitle={tx("synonym ও আঞ্চলিক শব্দ: মানুষ যে নামে ডাকে, সার্চ যেন সেটা বোঝে", "Synonyms and dialect words so search understands what people call parts")}
      actions={
        <Button size="sm" variant="outline" onClick={exportCsv}>
          <Download className="size-4" /> CSV
        </Button>
      }
      guide={tx(
        "এই টেবিলে আছে কোন শব্দ লিখলে বা বললে কোন ক্যাটাগরি খুলবে। নিচে দেখুন কোন সার্চে কিছু পাওয়া যায়নি আর রিকোয়েস্টে মানুষ কী শব্দ ব্যবহার করেছে; \"synonym যোগ\" চাপলেই যোগ হবে। নতুন শব্দ নিজে যোগ করতে ফর্ম ব্যবহার করুন।",
        "This table maps words people type or say to categories. Below are searches that found nothing and words from requests; press \"Add as synonym\" to add one. Use the form to add your own.",
      )}
    >
      <DataTable
        rows={shown}
        columns={cols}
        rowKey={(r) => r.id}
        search={(r) => `${r.term} ${target(r)} ${r.region ?? ""}`}
        searchPlaceholder={tx("শব্দ বা ক্যাটাগরি খুঁজুন…", "Search term or category…")}
        initialSort={{ key: "uses", dir: "desc" }}
        toolbar={
          <FilterSelect
            label={tx("উৎস", "Source")}
            value={source}
            onChange={setSource}
            options={[{ value: "all", label: tx("সব উৎস", "All sources") }, ...(Object.keys(SOURCE) as SynonymSource[]).map((s) => ({ value: s, label: L(SOURCE[s]) }))]}
          />
        }
      />
      <DictionarySuggestions rows={rows} cats={cats} />
      <SynonymForm cats={cats} rows={rows} />
    </AdminPage>
  );
}
