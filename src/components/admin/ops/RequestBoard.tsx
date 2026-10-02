"use client";

import clsx from "clsx";
import { Columns3, List, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { useNow } from "@/components/shared/Misc";
import { ButtonLink, Input } from "@/components/ui/primitives";
import { describeVehicle } from "@/lib/db/queries";
import { useDb } from "@/lib/db/store";
import type { PartRequest, RequestSource } from "@/lib/types";
import { DESK_COLUMNS, deskColumn, type DeskColumn } from "./requestUtils";
import { FilterChips, KanbanColumn, OpsPage, SOURCE_ICON, SourceIcon, useStaffName } from "./ui";

type Who = "all" | "me" | "none";

export function RequestBoard() {
  const { tx, L, d } = useT();
  const params = useSearchParams();
  const now = useNow(30_000);
  const db = useDb((s) => s);
  const initialCol = (params.get("col") as DeskColumn | null) ?? null;
  const [view, setView] = useState<"board" | "list">(initialCol ? "list" : "board");
  const [col, setCol] = useState<DeskColumn | "all">(initialCol ?? "all");
  const [source, setSource] = useState<RequestSource | "all">("all");
  const [who, setWho] = useState<Who>("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.requests
      .filter((r) => source === "all" || r.source === source)
      .filter((r) => (who === "all" ? true : who === "me" ? r.assigned_admin === db.session.staffId : !r.assigned_admin))
      .filter((r) => !t || r.request_no.toLowerCase().includes(t) || r.user_phone.includes(t) || (r.summary_bn ?? r.description_text ?? "").toLowerCase().includes(t))
      .map((r) => ({ r, col: deskColumn(r, db, now) }))
      .sort((a, b) => a.r.created_at.localeCompare(b.r.created_at));
  }, [db, now, q, source, who]);

  const counts = Object.fromEntries(DESK_COLUMNS.map((c) => [c.key, rows.filter((x) => x.col === c.key).length])) as Record<DeskColumn, number>;

  return (
    <OpsPage
      title={tx("রিকোয়েস্ট ডেস্ক", "Request desk")}
      subtitle={tx("ভয়েস/ছবি/অস্পষ্ট রিকোয়েস্ট শুনে পরিষ্কার করুন, তারপর দোকানে পাঠান।", "Listen, clarify, then send to shops.")}
      guide={tx("বাম দিকের লাল কলামে যেগুলো আছে সেগুলো আগে খুলুন। কার্ডে চাপলে বিস্তারিত খুলবে। ফোনে কেউ পার্ট চাইলে নতুন এন্ট্রি বাটন চাপুন।", "Open the red column first. Tap a card for details. Use New entry when someone calls in a request.")}
      actions={
        <ButtonLink href="/admin/requests/new" variant="brand">
          <Plus className="size-5" /> {tx("ফোন/WhatsApp এন্ট্রি", "Phone/WhatsApp entry")}
        </ButtonLink>
      }
    >
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("নম্বর, ফোন, শব্দ…", "No., phone, text…")} className="min-h-10 pl-9" />
          </div>
          <div className="flex rounded-xl border border-line bg-card p-1">
            {(["board", "list"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={clsx("inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold", view === v ? "bg-ink text-white" : "text-ink-2")}>
                {v === "board" ? <Columns3 className="size-4" /> : <List className="size-4" />}
                {v === "board" ? tx("বোর্ড", "Board") : tx("তালিকা", "List")}
              </button>
            ))}
          </div>
        </div>
        <FilterChips<RequestSource | "all">
          value={source}
          onChange={setSource}
          items={[{ value: "all", label: tx("সব উৎস", "All sources") }, ...(Object.keys(SOURCE_ICON) as RequestSource[]).map((k) => ({ value: k, label: `${SOURCE_ICON[k].icon} ${L(SOURCE_ICON[k])}` }))]}
        />
        <FilterChips<Who>
          value={who}
          onChange={setWho}
          items={[
            { value: "all", label: tx("সবার", "Everyone") },
            { value: "me", label: tx("আমার", "Mine") },
            { value: "none", label: tx("কেউ ধরেনি", "Unassigned") },
          ]}
        />
      </div>

      {view === "board" ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:overflow-x-auto lg:pb-3">
          {DESK_COLUMNS.map((c) => (
            <KanbanColumn key={c.key} title={L(c)} count={counts[c.key]} tone={c.tone}>
              {rows.filter((x) => x.col === c.key).map(({ r }) => <RequestCard key={r.id} r={r} now={now} />)}
              {counts[c.key] === 0 && <p className="px-2 py-4 text-center text-xs text-muted">{tx("খালি", "Empty")}</p>}
            </KanbanColumn>
          ))}
        </div>
      ) : (
        <>
          <FilterChips<DeskColumn | "all">
            value={col}
            onChange={setCol}
            items={[{ value: "all", label: tx("সব", "All"), count: rows.length }, ...DESK_COLUMNS.map((c) => ({ value: c.key, label: L(c), count: counts[c.key] }))]}
          />
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {rows.filter((x) => col === "all" || x.col === col).map(({ r }) => <RequestCard key={r.id} r={r} now={now} />)}
          </div>
          {rows.filter((x) => col === "all" || x.col === col).length === 0 && <p className="py-10 text-center text-muted">{tx("এই কলামে কিছু নেই", "Nothing in this column")}</p>}
        </>
      )}
      <p className="mt-3 text-xs text-muted">{tx(`মোট ${d(rows.length)}টা রিকোয়েস্ট`, `${rows.length} requests`)}</p>
    </OpsPage>
  );
}

function RequestCard({ r, now }: { r: PartRequest; now: number }) {
  const { tx, d, ago } = useT();
  const staffName = useStaffName();
  const quotes = useDb((s) => s.quotes.filter((q) => q.request_id === r.id && q.status !== "withdrawn").length);
  const ageH = (now - new Date(r.created_at).getTime()) / 3_600_000;
  const open = ["new", "needs_clarification", "open"].includes(r.status);
  const ageTone = !open ? "bg-surface text-ink-2" : ageH > 24 ? "bg-bad-soft text-bad" : ageH > 1 ? "bg-wait-soft text-wait" : "bg-ok-soft text-ok";
  const car = describeVehicle(r.generation_id, r.engine_id)?.withYear ?? r.vehicle_text ?? tx("গাড়ি জানা নেই", "Car unknown");
  return (
    <Link href={`/admin/requests/${r.id}`} className="block rounded-xl border border-line bg-card p-3 shadow-sm hover:border-ink/30">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold">{r.request_no}</span>
        <span className={clsx("rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", ageTone)}>⏱ {ago(r.created_at)}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <SourceIcon source={r.source} />
        <span className="text-xs font-semibold text-ink-2">🚗 {car}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm">{r.summary_bn ?? r.description_text ?? (r.voice_notes.length ? tx("🎤 শুধু ভয়েস, শুনে পরিষ্কার করুন", "🎤 Voice only, listen & clarify") : tx("📷 শুধু ছবি", "📷 Photo only"))}</p>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
        <span>
          🏪 {d(r.matches.length)} · 💬 {d(quotes)}
          {r.team_searching && <> · 🧭 {tx("মাঠে খোঁজা", "Field search")}</>}
        </span>
        <span className="truncate">👤 {r.assigned_admin ? staffName(r.assigned_admin) : tx("কেউ না", "Unassigned")}</span>
      </div>
    </Link>
  );
}
