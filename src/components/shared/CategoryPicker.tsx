"use client";

import { ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { categories, childCategories, getCategory, topCategories } from "@/lib/db/queries";
import type { Category } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { CategoryIcon } from "../ui/CategoryIcon";
import { Input } from "../ui/primitives";

/** Division icon grid → group → item, plus synonym search (file 01 §11.4). */
export function CategoryPicker({ onPick, leafOnly = true, initialParent }: { onPick: (c: Category) => void; leafOnly?: boolean; initialParent?: string }) {
  const { tx, lang } = useT();
  const [parentId, setParentId] = useState<string | null>(initialParent ?? null);
  const [q, setQ] = useState("");
  const parent = getCategory(parentId);
  const list = parentId ? childCategories(parentId) : topCategories();

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return categories
      .filter((c) => c.level === 3 && (c.name.toLowerCase().includes(t) || c.name_bn.includes(t) || c.synonyms.some((s) => s.includes(t))))
      .slice(0, 12);
  }, [q]);

  const name = (c: Category) => (lang === "bn" ? c.name_bn : c.name);
  const pick = (c: Category) => {
    const kids = childCategories(c.id);
    if (kids.length && (leafOnly || c.level === 1)) setParentId(c.id);
    else onPick(c);
  };

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("খুঁজুন: হেডলাইট, শকার, মবিল…", "Search: headlight, shock, oil…")} className="pl-12" />
      </div>
      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onPick(c)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-line bg-card px-3 text-left hover:border-ink/30">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand-ink"><CategoryIcon icon={c.icon} className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{name(c)}</span>
                  <span className="block text-xs text-muted">{name(getCategory(c.parent_id)!)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          {parent && (
            <button type="button" onClick={() => setParentId(parent.parent_id)} className="mb-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-ink-2">
              ← {tx("আগের তালিকা", "Back")} · <span className="text-ink">{name(parent)}</span>
            </button>
          )}
          <ul className={parentId ? "space-y-2" : "grid grid-cols-3 gap-2"}>
            {list.map((c) =>
              parentId ? (
                <li key={c.id}>
                  <button type="button" onClick={() => pick(c)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-line bg-card px-3 text-left hover:border-ink/30">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand-ink"><CategoryIcon icon={c.icon} className="size-5" /></span>
                    <span className="flex-1 font-semibold">{name(c)}</span>
                    {childCategories(c.id).length > 0 && <ChevronRight className="size-5 text-muted" />}
                  </button>
                </li>
              ) : (
                <li key={c.id}>
                  <button type="button" onClick={() => pick(c)} className="flex min-h-24 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-line bg-card p-2 text-center hover:border-ink/30">
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-ink"><CategoryIcon icon={c.icon} className="size-6" /></span>
                    <span className="text-xs font-semibold leading-tight">{name(c)}</span>
                  </button>
                </li>
              ),
            )}
          </ul>
          {parent && !leafOnly && (
            <button type="button" onClick={() => onPick(parent)} className="mt-3 min-h-12 w-full rounded-xl bg-surface font-semibold">
              {tx(`শুধু "${parent.name_bn}"`, `Just "${parent.name}"`)}
            </button>
          )}
        </>
      )}
    </div>
  );
}
