"use client";

import { useState } from "react";
import { AdminPage, KpiCard, KpiGrid } from "@/components/admin/core";
import { ReadOnlyNotice, useSettingsAccess } from "@/components/admin/core/settings/SettingsNav";
import { AddStaff } from "@/components/admin/core/system/AddStaff";
import { EffectivePermissions, PermissionMatrix } from "@/components/admin/core/system/PermissionMatrix";
import { StaffTable } from "@/components/admin/core/system/StaffTable";
import { useT } from "@/components/providers/LangProvider";
import { useDb } from "@/lib/db/store";

export default function StaffPage() {
  const { tx, d } = useT();
  const { canEdit } = useSettingsAccess();
  const staff = useDb((s) => s.staff);
  const meId = useDb((s) => s.session.staffId);
  const [selected, setSelected] = useState<string | null>(null);
  const sel = staff.find((s) => s.id === (selected ?? meId)) ?? null;
  const active = staff.filter((s) => s.active);

  return (
    <AdminPage
      title={tx("স্টাফ ও রোল", "Staff & roles")}
      subtitle={tx("এক জনের একাধিক রোল হতে পারে; সব পরিবর্তন অডিট লগে", "One person can hold several roles; every change is audited")}
      guide={tx(
        "তালিকা থেকে একজন স্টাফে ক্লিক করুন: নিচে তার রোল চিপ চালু/বন্ধ করা যায় আর ম্যাট্রিক্সে তার রোলের কলাম নীল হয়। নতুন স্টাফ যোগ করতে নাম, মোবাইল ও রোল দিন।",
        "Click a staff member: their role chips appear for toggling and their columns light up in the matrix. To add staff, enter name, mobile and roles.",
      )}
    >
      <ReadOnlyNotice show={!canEdit} />
      <KpiGrid>
        <KpiCard label={tx("মোট স্টাফ", "Total staff")} value={d(staff.length)} />
        <KpiCard label={tx("সক্রিয়", "Active")} value={d(active.length)} tone="ok" />
        <KpiCard label={tx("সুপার অ্যাডমিন", "Super admins")} value={d(active.filter((s) => s.roles.includes("super_admin")).length)} />
        <KpiCard label={tx("একাধিক রোল", "Multi-role")} value={d(staff.filter((s) => s.roles.length > 1).length)} />
      </KpiGrid>
      <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <StaffTable selected={sel?.id ?? null} onSelect={setSelected} canEdit={canEdit} />
        {sel && <EffectivePermissions staff={sel} />}
      </div>
      {canEdit && <AddStaff onAdded={setSelected} />}
      <PermissionMatrix staff={sel} />
    </AdminPage>
  );
}
