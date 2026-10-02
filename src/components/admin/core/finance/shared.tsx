"use client";

import clsx from "clsx";
import Link from "next/link";
import { useT } from "@/components/providers/LangProvider";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";

export const selectAll = (s: DB) => s;

/** Current staff and whether they are super_admin (header switcher changes it). */
export function useStaff() {
  const staffId = useDb((s) => s.session.staffId);
  const staff = useDb((s) => s.staff);
  const me = staff.find((x) => x.id === staffId) ?? null;
  const nameOf = (id: string | null) => staff.find((x) => x.id === id)?.name ?? id ?? "—";
  return { staffId, me, isSuper: !!me?.roles.includes("super_admin"), nameOf };
}

/** Signed money, green for credit, red for debit. */
export function Money({ value, signed, className }: { value: number; signed?: boolean; className?: string }) {
  const { taka } = useT();
  return (
    <span className={clsx("font-bold tabular-nums", signed && (value < 0 ? "text-bad" : value > 0 ? "text-ok" : ""), className)}>
      {signed && value > 0 ? "+" : value < 0 ? "−" : ""}
      {taka(Math.abs(value))}
    </span>
  );
}

export function OrderLink({ id, no }: { id: string; no: string }) {
  return (
    <Link href={`/admin/orders/${id}`} className="font-semibold text-brand hover:underline">
      {no}
    </Link>
  );
}

export function VendorLink({ id, name }: { id: string; name: string }) {
  return (
    <Link href={`/admin/vendors/${id}`} className="font-semibold text-brand hover:underline">
      {name}
    </Link>
  );
}

/** Mask a wallet/account number: only last 4 digits visible. */
export const maskWallet = (last4: string) => `•••••••${last4}`;

/**
 * `useNow()` ticks once a minute; entries posted since then (payout debits,
 * adjustments with available_at = now) must already count as available, or a
 * just-paid seller would look payable again. Use max(now, newest posting).
 */
export const effectiveNow = (s: DB, now: number) => s.ledger.reduce((m, e) => Math.max(m, new Date(e.created_at).getTime()), now);

export const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
