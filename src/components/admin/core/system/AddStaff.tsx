"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Chip, Field, Input } from "@/components/ui/primitives";
import { getDb } from "@/lib/db/store";
import { normalizePhone } from "@/lib/format";
import { staffRoleLabel } from "@/lib/labels";
import type { StaffRole } from "@/lib/types";
import { Panel } from "../Panel";
import { ROLES } from "./permissions";
import { addStaff } from "./staffActions";

export function AddStaff({ onAdded }: { onAdded: (id: string) => void }) {
  const { tx, L } = useT();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    const p = normalizePhone(phone);
    if (!name.trim()) return setErr(tx("নাম লিখুন", "Enter a name"));
    if (!p) return setErr(tx("সঠিক মোবাইল নম্বর দিন (০১…)", "Enter a valid mobile number (01…)"));
    if (getDb().staff.some((s) => s.phone === p)) return setErr(tx("এই নম্বরে স্টাফ আগেই আছে", "A staff member with this number exists"));
    if (!roles.length) return setErr(tx("অন্তত একটা রোল বাছুন", "Pick at least one role"));
    const id = addStaff(name.trim(), p, roles);
    setName("");
    setPhone("");
    setRoles([]);
    setErr(null);
    onAdded(id);
    toast(tx("স্টাফ যোগ হয়েছে", "Staff added"));
  };

  return (
    <Panel title={<><UserPlus className="inline size-4" aria-hidden /> {tx("নতুন স্টাফ যোগ", "Add staff")}</>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={tx("নাম", "Name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tx("যেমন: রুবিনা", "e.g. Rubina")} />
        </Field>
        <Field label={tx("মোবাইল", "Mobile")}>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="01XXXXXXXXX" />
        </Field>
      </div>
      <p className="mb-2 mt-3 font-semibold">{tx("রোল (একাধিক বাছা যায়)", "Roles (pick one or more)")}</p>
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <Chip key={r} active={roles.includes(r)} onClick={() => setRoles(roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r])}>
            {L(staffRoleLabel[r])}
          </Chip>
        ))}
      </div>
      {err && <p className="mt-2 text-sm font-semibold text-bad">{err}</p>}
      <Button variant="brand" size="lg" className="mt-4" onClick={submit}>
        <UserPlus className="size-5" aria-hidden /> {tx("স্টাফ যোগ করুন", "Add staff")}
      </Button>
    </Panel>
  );
}
