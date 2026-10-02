"use client";

import clsx from "clsx";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AdminPage, type Column, DataTable, Panel } from "@/components/admin/core";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, StatusPill } from "@/components/ui/primitives";
import type { AttributeTemplate } from "@/lib/types";
import { AttributeFieldForm } from "./AttributeFieldForm";
import { AttributePreview } from "./AttributePreview";
import { INPUT_TYPES, TEMPLATES, templateLabel } from "./constants";
import { type AdminAttribute, deleteAttribute, saveAttribute, useAttributes, useCategories } from "./overlay";

export function AttributesScreen({ initial }: { initial: AttributeTemplate | null }) {
  const { tx, d, L, lang } = useT();
  const attrs = useAttributes();
  const cats = useCategories();
  const [t, setT] = useState<AttributeTemplate>(initial ?? "BRAKE");
  const [editing, setEditing] = useState<AdminAttribute | "new" | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const fields = attrs.filter((a) => a.template === t);
  const usedBy = cats.filter((c) => c.attribute_template === t);
  const pick = (v: AttributeTemplate) => {
    setT(v);
    setEditing(null);
    setConfirmDel(null);
  };

  const cols: Column<AdminAttribute>[] = [
    { key: "key", header: "key", cell: (a) => <code className="text-xs">{a.key}</code> },
    { key: "bn", header: tx("বাংলা লেবেল", "Bangla label"), cell: (a) => <span className="font-semibold">{a.label_bn}</span> },
    { key: "en", header: tx("ইংরেজি লেবেল", "English label"), cell: (a) => a.label_en, hideOnMobile: true },
    { key: "type", header: tx("ধরন", "Type"), cell: (a) => L(INPUT_TYPES.find((x) => x.value === a.input_type)) },
    {
      key: "opts",
      header: tx("অপশন", "Options"),
      hideOnMobile: true,
      cell: (a) => (a.options?.length ? <span className="text-xs">{a.options.map((o) => (lang === "bn" ? o.bn : o.en)).join(" · ")}</span> : <span className="text-muted">—</span>),
    },
    { key: "unit", header: tx("একক", "Unit"), cell: (a) => a.unit ?? "—", hideOnMobile: true },
    { key: "req", header: tx("বাধ্যতামূলক", "Required"), cell: (a) => (a.required ? <StatusPill tone="wait">{tx("হ্যাঁ", "Yes")}</StatusPill> : <span className="text-muted">{tx("না", "No")}</span>) },
    {
      key: "act",
      header: "",
      cell: (a) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => { setEditing(a); setConfirmDel(null); }} aria-label={tx("সম্পাদনা", "Edit")}>
            <Pencil className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              if (confirmDel !== a.id) return setConfirmDel(a.id);
              deleteAttribute(a);
              setConfirmDel(null);
              if (editing !== "new" && editing?.id === a.id) setEditing(null);
              toast(tx("ফিল্ড মুছে ফেলা হয়েছে", "Field deleted"));
            }}
          >
            <Trash2 className="size-4" /> {confirmDel === a.id ? tx("নিশ্চিত?", "Sure?") : ""}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      back="/admin/catalog"
      title={tx("অ্যাট্রিবিউট টেমপ্লেট", "Attribute templates")}
      subtitle={tx("কোন ধরনের পার্টে বিক্রেতা কী কী তথ্য দেবে (ফাইল ০৪ সেকশন ৬)", "What each part type asks the seller (file 04 §6)")}
      guide={tx(
        "বাম দিক থেকে একটা টেমপ্লেট বাছুন। মাঝখানে তার ফিল্ডগুলো দেখবেন, যোগ বা সম্পাদনা করতে পারবেন। ডান দিকের ফোনে দেখুন বিক্রেতার মোবাইলে প্রশ্নগুলো কেমন দেখাবে, চেপে চেপে পরীক্ষা করুন।",
        "Pick a template on the left. Its fields appear in the middle where you can add or edit them. The phone on the right shows exactly how the seller will see the questions; tap to try it.",
      )}
    >
      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] 2xl:grid-cols-[15rem_minmax(0,1fr)_24rem]">
        <Panel title={tx("টেমপ্লেট", "Templates")} bodyClass="p-2 max-h-[80vh] overflow-y-auto">
          <ul className="space-y-0.5">
            {TEMPLATES.map((x) => {
              const n = attrs.filter((a) => a.template === x.value).length;
              const c = cats.filter((k) => k.attribute_template === x.value).length;
              return (
                <li key={x.value}>
                  <button
                    type="button"
                    onClick={() => pick(x.value)}
                    className={clsx("flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm", t === x.value ? "bg-ink text-white" : "hover:bg-ink/5")}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{L(x)}</span>
                      <span className="block truncate font-mono text-[10px] opacity-70">{x.value}</span>
                    </span>
                    <span className="shrink-0 text-right text-[11px] leading-tight opacity-80">
                      {tx(`${d(n)} ফিল্ড`, `${n} fields`)}
                      <br />
                      {tx(`${d(c)} ক্যাটাগরি`, `${c} cats`)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="min-w-0 space-y-5">
          <DataTable
            caption={`${L(templateLabel(t))} · ${t}`}
            rows={fields}
            columns={cols}
            rowKey={(a) => a.id}
            empty={tx("এই টেমপ্লেটে কোনো ফিল্ড নেই", "No fields in this template")}
            toolbar={
              <Button size="sm" variant="brand" onClick={() => setEditing("new")}>
                <Plus className="size-4" /> {tx("নতুন ফিল্ড", "New field")}
              </Button>
            }
          />
          {editing && (
            <Panel title={editing === "new" ? tx("নতুন ফিল্ড", "New field") : tx(`সম্পাদনা: ${editing.label_bn}`, `Edit: ${editing.label_en}`)}>
              <AttributeFieldForm
                key={editing === "new" ? `new-${t}` : editing.id}
                template={t}
                field={editing === "new" ? null : editing}
                existingKeys={fields.map((f) => f.key)}
                onCancel={() => setEditing(null)}
                onSave={(def) => {
                  saveAttribute(editing === "new" ? null : editing.id, def);
                  setEditing(null);
                  toast(tx("ফিল্ড সংরক্ষণ হয়েছে", "Field saved"));
                }}
              />
            </Panel>
          )}
          <Panel title={tx(`যে ক্যাটাগরিতে ব্যবহার হয় (${d(usedBy.length)})`, `Used by categories (${usedBy.length})`)}>
            <div className="flex flex-wrap gap-1.5 text-sm">
              {usedBy.slice(0, 60).map((c) => (
                <Link key={c.id} href="/admin/catalog/categories" className="rounded-full border border-line px-2.5 py-1 hover:border-ink/40">
                  {lang === "bn" ? c.name_bn : c.name}
                </Link>
              ))}
              {usedBy.length === 0 && <span className="text-muted">{tx("কোনো ক্যাটাগরি এই টেমপ্লেট ব্যবহার করে না", "No category uses this template")}</span>}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2 2xl:col-span-1">
          <p className="mb-2 text-center text-sm font-semibold text-muted">{tx("লাইভ প্রিভিউ: বিক্রেতার ফোনে", "Live preview: seller's phone")}</p>
          <AttributePreview key={`${t}:${fields.map((f) => f.id + f.input_type + (f.options?.length ?? 0)).join(",")}`} fields={fields} templateLabel={L(templateLabel(t))} />
        </div>
      </div>
    </AdminPage>
  );
}
