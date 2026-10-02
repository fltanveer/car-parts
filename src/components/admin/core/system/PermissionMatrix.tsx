"use client";

import clsx from "clsx";
import { useT } from "@/components/providers/LangProvider";
import { staffRoleLabel } from "@/lib/labels";
import type { Staff } from "@/lib/types";
import { Panel } from "../Panel";
import { accessFor, MATRIX, ROLES, type Access } from "./permissions";

const ROLE_SHORT: Record<string, string> = {
  super_admin: "super", ops_manager: "ops", request_desk: "req", vendor_success: "vsucc", field_agent: "field",
  catalog_manager: "catalog", trust_safety: "t&s", finance: "fin", logistics: "logi", car_desk: "car",
};

export const accessIcon = (a: Access) => (a === "edit" ? "✅" : a === "view" ? "👁️" : "");

function Legend() {
  const { tx } = useT();
  return (
    <p className="flex flex-wrap gap-4 text-sm">
      <span>✅ {tx("সম্পাদনা", "Edit")}</span>
      <span>👁️ {tx("শুধু দেখা", "View only")}</span>
      <span className="text-muted">— {tx("খালি = অনুমতি নেই", "blank = no access")}</span>
    </p>
  );
}

/** File 03 §2 matrix; columns of the selected staff's roles are highlighted. */
export function PermissionMatrix({ staff }: { staff: Staff | null }) {
  const { tx, L } = useT();
  const hi = new Set(staff?.roles ?? []);
  return (
    <Panel title={tx("পারমিশন ম্যাট্রিক্স", "Permission matrix")} actions={<Legend />} bodyClass="p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="text-xs">
              <th scope="col" className="sticky left-0 bg-card px-3 py-2 text-left">{tx("মডিউল", "Module")}</th>
              {ROLES.map((r) => (
                <th key={r} scope="col" title={L(staffRoleLabel[r])} className={clsx("px-1.5 py-2 text-center font-semibold", hi.has(r) ? "bg-brand text-white" : "text-muted")}>
                  {ROLE_SHORT[r]}
                </th>
              ))}
              {staff && <th scope="col" className="bg-ink px-2 py-2 text-center text-white">{tx("কার্যকর", "Effective")}</th>}
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((m) => (
              <tr key={m.key} className="border-t border-line">
                <th scope="row" className="sticky left-0 bg-card px-3 py-2 text-left font-semibold">{tx(m.bn, m.en)}</th>
                {m.cells.map((c, i) => {
                  const r = ROLES[i];
                  const note = m.notes?.[r];
                  return (
                    <td key={r} className={clsx("px-1.5 py-2 text-center", hi.has(r) && "bg-brand-soft/50")}>
                      {accessIcon(c)}
                      {note && c && <span className="block text-[10px] text-muted">({tx(...note)})</span>}
                    </td>
                  );
                })}
                {staff && <td className="bg-surface px-2 py-2 text-center text-base">{accessIcon(accessFor(staff.roles, m.key)) || "—"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/** Max of the selected staff's roles per module. */
export function EffectivePermissions({ staff }: { staff: Staff }) {
  const { tx, L, d } = useT();
  const rows = MATRIX.map((m) => ({ m, a: staff.active ? accessFor(staff.roles, m.key) : null }));
  const edit = rows.filter((r) => r.a === "edit");
  const view = rows.filter((r) => r.a === "view");
  const none = rows.filter((r) => !r.a);
  const group = (title: string, list: typeof rows, cls: string) => (
    <div>
      <p className="mb-1.5 text-sm font-bold">{title} ({d(list.length)})</p>
      <div className="flex flex-wrap gap-1.5">
        {list.map(({ m }) => (
          <span key={m.key} className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>{tx(m.bn, m.en)}</span>
        ))}
        {list.length === 0 && <span className="text-xs text-muted">—</span>}
      </div>
    </div>
  );
  return (
    <Panel title={tx(`কার্যকর অনুমতি: ${staff.name}`, `Effective permissions: ${staff.name}`)}>
      <p className="mb-3 text-sm text-muted">
        {staff.roles.map((r) => L(staffRoleLabel[r])).join(" + ")} · {tx("একাধিক রোলে সবচেয়ে বেশি অনুমতিটা কার্যকর", "With several roles the highest access wins")}
        {!staff.active && <span className="ml-1 font-bold text-bad">· {tx("নিষ্ক্রিয়: কোনো অনুমতি নেই", "Inactive: no access")}</span>}
      </p>
      <div className="space-y-3">
        {group(`✅ ${tx("সম্পাদনা", "Edit")}`, edit, "bg-ok-soft text-ok")}
        {group(`👁️ ${tx("শুধু দেখা", "View")}`, view, "bg-wait-soft text-wait")}
        {group(tx("অনুমতি নেই", "No access"), none, "bg-surface text-muted")}
      </div>
    </Panel>
  );
}
