"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, StatusPill } from "@/components/ui/primitives";
import { displayPhone } from "@/lib/format";
import { staffRoleLabel } from "@/lib/labels";
import { useDb } from "@/lib/db/store";
import type { Staff } from "@/lib/types";
import { DataTable, type Column } from "../DataTable";
import { ROLES } from "./permissions";
import { setStaffActive, toggleStaffRole } from "./staffActions";

export function StaffTable({ selected, onSelect, canEdit }: { selected: string | null; onSelect: (id: string) => void; canEdit: boolean }) {
  const { tx, L, d } = useT();
  const staff = useDb((s) => s.staff);
  const meId = useDb((s) => s.session.staffId);

  const cols: Column<Staff>[] = [
    {
      key: "name", header: tx("নাম", "Name"), sort: (s) => s.name,
      cell: (s) => (
        <span className="font-semibold">
          {s.name}
          {s.id === meId && <span className="ml-1 text-xs text-brand">({tx("আপনি", "you")})</span>}
          <span className="block text-xs font-normal text-muted">{d(displayPhone(s.phone))}</span>
        </span>
      ),
    },
    {
      key: "roles", header: tx("রোল", "Roles"),
      cell: (s) => (
        <span className="flex flex-wrap gap-1">
          {s.roles.map((r) => (
            <span key={r} className={clsx("rounded-full px-2 py-0.5 text-xs font-semibold", r === "super_admin" ? "bg-ink text-white" : "bg-surface")}>{L(staffRoleLabel[r])}</span>
          ))}
        </span>
      ),
    },
    { key: "status", header: tx("অবস্থা", "Status"), sort: (s) => (s.active ? 1 : 0), cell: (s) => <StatusPill tone={s.active ? "ok" : "info"}>{s.active ? tx("সক্রিয়", "Active") : tx("নিষ্ক্রিয়", "Inactive")}</StatusPill> },
    {
      key: "act", header: "",
      cell: (s) => canEdit ? (
        <Button
          size="sm"
          variant={s.active ? "danger" : "ok"}
          onClick={(e) => {
            e.stopPropagation();
            const ok = setStaffActive(s.id, !s.active);
            toast(ok ? (s.active ? tx("নিষ্ক্রিয় করা হয়েছে", "Deactivated") : tx("চালু করা হয়েছে", "Activated")) : tx("শেষ সুপার অ্যাডমিনকে বন্ধ করা যাবে না", "Can't deactivate the last super admin"), ok ? "info" : "bad");
          }}
        >
          {s.active ? tx("নিষ্ক্রিয় করুন", "Deactivate") : tx("চালু করুন", "Activate")}
        </Button>
      ) : null,
    },
  ];

  return (
    <DataTable
      caption={tx("স্টাফ তালিকা (ক্লিক করে বাছুন)", "Staff (click to select)")}
      rows={staff}
      columns={cols}
      rowKey={(s) => s.id}
      search={(s) => `${s.name} ${s.phone} ${s.roles.join(" ")}`}
      onRowClick={(s) => onSelect(s.id)}
      rowClassName={(s) => clsx(s.id === selected && "bg-brand-soft/40", !s.active && "opacity-60")}
      expanded={(s) =>
        s.id === selected && canEdit ? (
          <div className="pt-2">
            <p className="mb-2 text-sm font-semibold">{tx("রোল চালু/বন্ধ করুন (একাধিক হতে পারে)", "Toggle roles (multiple allowed)")}</p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const on = s.roles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      const ok = toggleStaffRole(s.id, r);
                      if (!ok) toast(tx("অন্তত একটা রোল ও একজন সুপার অ্যাডমিন থাকতে হবে", "Keep at least one role and one super admin"), "bad");
                      else toast(on ? tx(`${L(staffRoleLabel[r])} সরানো হয়েছে`, `${L(staffRoleLabel[r])} removed`) : tx(`${L(staffRoleLabel[r])} দেওয়া হয়েছে`, `${L(staffRoleLabel[r])} granted`), "info");
                    }}
                    className={clsx("inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold", on ? "border-brand bg-brand text-white" : "border-line bg-card hover:border-ink/40")}
                  >
                    {on && <Check className="size-4" aria-hidden />}
                    {L(staffRoleLabel[r])}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null
      }
    />
  );
}
