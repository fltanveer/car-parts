"use client";

import clsx from "clsx";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { type AdminCategory, childrenOf } from "./overlay";

/** Three-level category tree with expand/collapse and search (file 03 §9.1). */
export function CategoryTree({ list, selected, onSelect }: { list: AdminCategory[]; selected: string | null; onSelect: (id: string) => void }) {
  const { tx, lang, d } = useT();
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [q, setQ] = useState("");
  // Reveal the selected node (e.g. a freshly added child): open its ancestors.
  const [revealed, setRevealed] = useState<string | null>(null);
  if (selected && selected !== revealed) {
    setRevealed(selected);
    const anc: string[] = [];
    let cur = list.find((x) => x.id === selected);
    while (cur?.parent_id) {
      anc.push(cur.parent_id);
      const pid = cur.parent_id;
      cur = list.find((x) => x.id === pid);
    }
    if (anc.some((a) => !open.has(a))) setOpen(new Set([...open, ...anc]));
  }

  // When searching: ids that match or have a matching descendant.
  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return null;
    const hit = (c: AdminCategory) => c.name.toLowerCase().includes(t) || c.name_bn.includes(t) || c.synonyms.some((s) => s.toLowerCase().includes(t)) || c.slug.includes(t);
    const keep = new Set<string>();
    list.filter(hit).forEach((c) => {
      let cur: AdminCategory | undefined = c;
      while (cur) {
        keep.add(cur.id);
        const pid: string | null = cur.parent_id;
        cur = list.find((x) => x.id === pid);
      }
    });
    return keep;
  }, [q, list]);

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const render = (parent: string | null, depth: number) => {
    const kids = childrenOf(list, parent).filter((c) => !visible || visible.has(c.id));
    if (!kids.length) return null;
    return (
      <ul className={clsx(depth > 0 && "ml-4 border-l border-line pl-2")}>
        {kids.map((c) => {
          const n = childrenOf(list, c.id).length;
          const isOpen = !!visible || open.has(c.id);
          return (
            <li key={c.id}>
              <div className={clsx("flex items-center gap-1 rounded-lg", selected === c.id && "bg-brand-soft/60 ring-1 ring-brand")}>
                {n > 0 ? (
                  <button type="button" onClick={() => toggle(c.id)} aria-label={isOpen ? tx("বন্ধ", "Collapse") : tx("খুলুন", "Expand")} className="grid size-8 shrink-0 place-items-center rounded-md hover:bg-ink/5">
                    {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>
                ) : (
                  <span className="size-8 shrink-0" />
                )}
                <button type="button" onClick={() => onSelect(c.id)} className="flex min-h-9 min-w-0 flex-1 items-center gap-2 py-1 pr-2 text-left text-sm">
                  {c.level === 1 && <CategoryIcon icon={c.icon} className="size-4 shrink-0 text-muted" />}
                  <span className={clsx("truncate", c.level === 1 && "font-bold", c.level === 2 && "font-semibold")}>{lang === "bn" ? c.name_bn : c.name}</span>
                  {n > 0 && <span className="text-xs text-muted">({d(n)})</span>}
                  {c.is_new && <span className="rounded bg-ok-soft px-1.5 text-[10px] font-bold text-ok">{tx("নতুন", "new")}</span>}
                  {c.edited && <span className="rounded bg-wait-soft px-1.5 text-[10px] font-bold text-wait">{tx("সম্পাদিত", "edited")}</span>}
                  {c.is_restricted && <span className="rounded bg-bad-soft px-1.5 text-[10px] font-bold text-bad">{tx("সীমিত", "restricted")}</span>}
                </button>
              </div>
              {isOpen && render(c.id, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div>
      <label className="relative mb-3 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tx("ক্যাটাগরি বা ডাকনাম খুঁজুন…", "Search category or nickname…")}
          className="min-h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand"
        />
      </label>
      <div className="mb-2 flex gap-2 text-xs">
        <button type="button" className="font-semibold text-brand hover:underline" onClick={() => setOpen(new Set(list.filter((c) => c.level < 3).map((c) => c.id)))}>
          {tx("সব খুলুন", "Expand all")}
        </button>
        <button type="button" className="font-semibold text-brand hover:underline" onClick={() => setOpen(new Set())}>
          {tx("সব বন্ধ", "Collapse all")}
        </button>
      </div>
      {render(null, 0) ?? <p className="py-6 text-center text-sm text-muted">{tx("কিছু পাওয়া যায়নি", "Nothing found")}</p>}
    </div>
  );
}
