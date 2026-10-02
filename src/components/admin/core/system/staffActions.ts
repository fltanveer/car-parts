"use client";

// Staff & role writes (file 03 §2, §22). Every change is audited.
import { audit } from "@/lib/db/actions";
import { uid } from "@/lib/db/seed";
import { getDb, update } from "@/lib/db/store";
import { staffRoleLabel } from "@/lib/labels";
import type { Staff, StaffRole } from "@/lib/types";

const byId = (id: string) => getDb().staff.find((s) => s.id === id);
const activeSupers = () => getDb().staff.filter((s) => s.active && s.roles.includes("super_admin"));

export const addStaff = (name: string, phone: string, roles: StaffRole[]) => {
  const st: Staff = { id: `st-${uid()}`, name, phone, roles, active: true };
  update((s) => ({ staff: [...s.staff, st] }));
  audit("স্টাফ যোগ", `${name} (${roles.map((r) => staffRoleLabel[r].bn).join(", ")})`);
  return st.id;
};

/** Returns false when the change would leave no active super admin. */
export const toggleStaffRole = (id: string, role: StaffRole): boolean => {
  const st = byId(id);
  if (!st) return false;
  const has = st.roles.includes(role);
  if (has && role === "super_admin" && st.active && activeSupers().length <= 1) return false;
  if (has && st.roles.length === 1) return false; // at least one role
  const roles = has ? st.roles.filter((r) => r !== role) : [...st.roles, role];
  update((s) => ({ staff: s.staff.map((x) => (x.id === id ? { ...x, roles } : x)) }));
  audit(has ? "স্টাফের রোল সরানো" : "স্টাফকে রোল দেওয়া", `${st.name}: ${staffRoleLabel[role].bn}`);
  return true;
};

export const setStaffActive = (id: string, active: boolean): boolean => {
  const st = byId(id);
  if (!st) return false;
  if (!active && st.roles.includes("super_admin") && activeSupers().length <= 1) return false;
  update((s) => ({ staff: s.staff.map((x) => (x.id === id ? { ...x, active } : x)) }));
  audit(active ? "স্টাফ চালু" : "স্টাফ নিষ্ক্রিয়", st.name);
  return true;
};
