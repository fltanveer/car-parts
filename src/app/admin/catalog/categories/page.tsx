"use client";

import { useState } from "react";
import { AdminPage, KpiCard, KpiGrid, Panel } from "@/components/admin/core";
import { CategoryEditor } from "@/components/admin/core/catalog/CategoryEditor";
import { CategoryTree } from "@/components/admin/core/catalog/CategoryTree";
import { useCategories } from "@/components/admin/core/catalog/overlay";
import { useT } from "@/components/providers/LangProvider";
import { ButtonLink, EmptyState } from "@/components/ui/primitives";

export default function CategoriesPage() {
  const { tx, d } = useT();
  const list = useCategories();
  const [sel, setSel] = useState<string | null>(null);
  const c = list.find((x) => x.id === sel) ?? null;

  return (
    <AdminPage
      back="/admin/catalog"
      title={tx("ক্যাটাগরি ট্রি", "Category tree")}
      subtitle={tx("বিভাগ → উপবিভাগ → আইটেম (ফাইল ০৪ সেকশন ৫)", "Division → group → item (file 04 §5)")}
      actions={<ButtonLink href="/admin/catalog/attributes" variant="outline" size="sm">{tx("অ্যাট্রিবিউট টেমপ্লেট", "Attribute templates")}</ButtonLink>}
      guide={tx(
        "বাম দিকের ট্রি থেকে একটা ক্যাটাগরি বাছুন। ডান দিকে নাম, আইকন, ডাকনাম, ন্যূনতম ছবি, কমিশন বদলে নিচের বড় সবুজ বাটনে সংরক্ষণ করুন। উপরে-নিচে বাটন দিয়ে ক্রম বদলান, নতুন উপ-ক্যাটাগরি যোগ করুন। সব পরিবর্তন অডিট লগে থাকে।",
        "Pick a category in the tree. On the right, change names, icon, nicknames, minimum photos or commission, then press the big save button. Use up/down to reorder and add child categories. Every change is audited.",
      )}
    >
      <KpiGrid>
        <KpiCard label={tx("বিভাগ", "Divisions")} value={d(list.filter((x) => x.level === 1).length)} />
        <KpiCard label={tx("উপবিভাগ", "Groups")} value={d(list.filter((x) => x.level === 2).length)} />
        <KpiCard label={tx("আইটেম", "Items")} value={d(list.filter((x) => x.level === 3).length)} />
        <KpiCard label={tx("সীমিত ক্যাটাগরি", "Restricted")} value={d(list.filter((x) => x.is_restricted).length)} tone="wait" />
      </KpiGrid>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Panel title={tx("ট্রি", "Tree")} bodyClass="p-3 max-h-[75vh] overflow-y-auto">
          <CategoryTree list={list} selected={sel} onSelect={setSel} />
        </Panel>
        <div className="min-w-0">
          {c ? (
            <CategoryEditor key={c.id} c={c} list={list} onSelect={setSel} />
          ) : (
            <EmptyState title={tx("একটা ক্যাটাগরি বাছুন", "Pick a category")} body={tx("বাম দিকের ট্রি থেকে যেকোনো ঘরে চাপ দিন", "Tap any node in the tree on the left")} />
          )}
        </div>
      </div>
    </AdminPage>
  );
}
