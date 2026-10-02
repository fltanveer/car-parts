"use client";

import { Store } from "lucide-react";
import type { ReactNode } from "react";
import { switchVendor } from "@/lib/db/actions";
import { useDb, useHydrated } from "@/lib/db/store";
import type { Vendor } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { HelpCall } from "../shared/Misc";
import { ButtonLink, Container, EmptyState } from "../ui/primitives";

/** The logged-in seller's shop (session.vendorId) or null. */
export function useVendor(): Vendor | null {
  return useDb((s) => s.vendors.find((v) => v.id === s.session.vendorId) ?? null);
}

/** Vendor id from the session (never null inside <SellerGate>). */
export function useVendorId(): string {
  return useDb((s) => s.session.vendorId) ?? "";
}

/**
 * Renders children only after hydration (screens read localStorage drafts)
 * and only when a seller is logged in; otherwise points to /seller/join.
 */
export function SellerGate({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const vendor = useVendor();
  const { tx } = useT();
  const demo = useDb((s) => s.vendors.filter((v) => v.status === "active").slice(0, 3));
  if (!hydrated) {
    return (
      <Container className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-card" />
        <div className="h-40 animate-pulse rounded-2xl bg-card" />
      </Container>
    );
  }
  if (!vendor) {
    return (
      <Container className="space-y-4">
        <EmptyState
          icon={<Store className="size-7" />}
          title={tx("আপনি এখনো বিক্রেতা নন", "You're not a seller yet")}
          body={tx("৫ মিনিটে দোকান খুলুন। যাচাই পরে করলেও চলবে।", "Open your shop in 5 minutes. Verify later.")}
          action={<ButtonLink href="/seller/join" variant="brand" size="lg">🏪 {tx("বিক্রেতা হোন", "Become a seller")}</ButtonLink>}
        />
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="mb-2 text-sm font-semibold text-muted">{tx("ডেমো: অন্য দোকান হিসেবে দেখুন", "Demo: view as a shop")}</p>
          <div className="flex flex-wrap gap-2">
            {demo.map((v) => (
              <button key={v.id} type="button" onClick={() => switchVendor(v.id)} className="min-h-11 rounded-xl bg-surface px-3 text-sm font-semibold">
                {v.shop_name_bn}
              </button>
            ))}
          </div>
        </div>
        <HelpCall />
      </Container>
    );
  }
  return <>{children}</>;
}
