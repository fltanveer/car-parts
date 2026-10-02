"use client";

// Permission matrix (file 03 §2). "edit" = ✅, "view" = 👁️, null = no access.
import { useDb } from "@/lib/db/store";
import type { Staff, StaffRole } from "@/lib/types";

export type Access = "edit" | "view" | null;

export const ROLES: StaffRole[] = [
  "super_admin", "ops_manager", "request_desk", "vendor_success", "field_agent", "catalog_manager", "trust_safety", "finance", "logistics", "car_desk",
];

export type ModuleKey =
  | "dashboard" | "requests" | "vendors" | "moderation" | "catalog" | "orders" | "finance" | "disputes" | "complaints"
  | "messages" | "logistics" | "cars" | "garage_docs" | "reports" | "settings" | "audit";

const E = "edit" as const;
const V = "view" as const;
const _ = null;

// Columns in ROLES order: super ops req vsucc field catalog t&s fin logi car
export const MATRIX: { key: ModuleKey; bn: string; en: string; cells: Access[]; notes?: Partial<Record<StaffRole, [string, string]>> }[] = [
  { key: "dashboard", bn: "ড্যাশবোর্ড", en: "Dashboard", cells: [E, E, E, E, V, E, E, E, E, E] },
  { key: "requests", bn: "রিকোয়েস্ট ডেস্ক", en: "Request desk", cells: [E, E, E, V, _, V, V, _, _, _] },
  { key: "vendors", bn: "বিক্রেতা", en: "Sellers", cells: [E, E, V, E, E, V, E, V, V, _], notes: { field_agent: ["নিজের", "own"] } },
  { key: "moderation", bn: "লিস্টিং মডারেশন", en: "Listing moderation", cells: [E, E, _, V, _, E, E, _, _, _] },
  { key: "catalog", bn: "ক্যাটালগ/গাড়ি/অ্যাট্রিবিউট", en: "Catalog/vehicles/attributes", cells: [E, V, _, _, _, E, _, _, _, V] },
  { key: "orders", bn: "অর্ডার", en: "Orders", cells: [E, E, E, V, _, _, E, E, E, _] },
  { key: "finance", bn: "পেমেন্ট/রিফান্ড/পেআউট", en: "Payments/refunds/payouts", cells: [E, V, _, _, _, _, V, E, _, _] },
  { key: "disputes", bn: "বিরোধ/দাবি", en: "Disputes/claims", cells: [E, E, V, V, _, _, E, E, V, _], notes: { finance: ["টাকা", "money"] } },
  { key: "complaints", bn: "অভিযোগ ও রিপোর্ট", en: "Complaints & reports", cells: [E, E, E, _, _, _, E, _, _, _] },
  { key: "messages", bn: "মেসেজ মনিটর", en: "Message monitor", cells: [E, E, E, E, _, _, E, _, _, _] },
  { key: "logistics", bn: "পিকআপ/হাব", en: "Pickup/hub", cells: [E, E, _, _, _, _, _, _, E, _] },
  { key: "cars", bn: "গাড়ি কেনাবেচা", en: "Car marketplace", cells: [E, E, _, _, _, _, E, _, _, E] },
  { key: "garage_docs", bn: "আমার গাড়ি কাগজ যাচাই", en: "Garage doc checks", cells: [E, E, E, _, _, _, _, _, _, E] },
  { key: "reports", bn: "রিপোর্ট", en: "Reports", cells: [E, E, V, V, _, V, V, E, V, V] },
  { key: "settings", bn: "সেটিংস/কমিশন/স্টাফ", en: "Settings/commission/staff", cells: [E, _, _, _, _, _, _, _, _, _] },
  { key: "audit", bn: "অডিট লগ", en: "Audit log", cells: [E, V, _, _, _, _, V, _, _, _] },
];

const rank = (a: Access) => (a === "edit" ? 2 : a === "view" ? 1 : 0);

export const accessFor = (roles: StaffRole[], module: ModuleKey): Access => {
  const row = MATRIX.find((m) => m.key === module);
  if (!row) return null;
  let best: Access = null;
  roles.forEach((r) => {
    const a = row.cells[ROLES.indexOf(r)];
    if (rank(a) > rank(best)) best = a;
  });
  return best;
};

/** Logged-in staff (header switcher) and their access to a module. */
export function useStaffAccess(module: ModuleKey) {
  const me = useDb((s) => s.staff.find((x) => x.id === s.session.staffId) ?? null);
  const access: Access = me && me.active ? accessFor(me.roles, module) : null;
  return { me, access, canEdit: access === "edit", canView: access !== null };
}

export const staffName = (staff: Staff[], id: string) => staff.find((s) => s.id === id)?.name ?? id;
