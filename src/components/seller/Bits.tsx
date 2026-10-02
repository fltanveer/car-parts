"use client";

import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import { describeVehicle } from "@/lib/db/queries";
import { listingStatusLabel } from "@/lib/labels";
import type { Listing } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { MediaImage } from "../ui/MediaImage";
import { Sheet } from "../ui/Sheet";
import { Button, StatusPill } from "../ui/primitives";

/** Fitment text for a listing: first car + "+N more" or "all cars". */
export function useFitText() {
  const { tx, d } = useT();
  return (l: Pick<Listing, "fitments" | "is_universal">) => {
    if (l.is_universal) return tx("সব গাড়িতে", "All cars");
    const first = l.fitments[0];
    if (!first) return tx("গাড়ি দেওয়া নেই", "No car set");
    const v = describeVehicle(first.generation_id);
    const name = v ? `${v.short} ${v.years}` : tx("গাড়ি", "Car");
    return l.fitments.length > 1 ? `${name} +${d(l.fitments.length - 1)}` : name;
  };
}

/** Compact listing row used by pickers (quote form, chat cards). */
export function ListingMini({ listing, onClick, selected, right }: { listing: Listing; onClick?: () => void; selected?: boolean; right?: ReactNode }) {
  const { taka, L, lang } = useT();
  const fit = useFitText();
  const body = (
    <>
      <MediaImage src={listing.media[0]?.url} alt={listing.title_bn} className="size-16 shrink-0 rounded-xl" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{lang === "bn" ? listing.title_bn : listing.title}</span>
        <span className="block truncate text-sm text-muted">{fit(listing)}</span>
        <span className="mt-0.5 flex items-center gap-2">
          <b>{taka(listing.price)}</b>
          <StatusPill tone={listingStatusLabel[listing.status].tone}>{L(listingStatusLabel[listing.status])}</StatusPill>
        </span>
      </span>
      {right}
    </>
  );
  const cls = clsx("flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-2.5 text-left", selected ? "border-brand bg-brand-soft/40" : "border-line");
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** "Are you sure?" sheet with one big confirm button. */
export function ConfirmSheet({
  open, onClose, title, body, confirmLabel, onConfirm, tone = "ok", children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  tone?: "ok" | "danger" | "brand";
  children?: ReactNode;
}) {
  const { tx } = useT();
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="space-y-4 pb-2">
        {body && <div className="text-lg">{body}</div>}
        {children}
        <Button variant={tone} size="xl" full onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" size="lg" full onClick={onClose}>
          {tx("না, ফিরে যাই", "No, go back")}
        </Button>
      </div>
    </Sheet>
  );
}

/** Big home-style task card: icon, title, sub text, arrow (file 02 §4). */
export function TaskCard({ href, icon, title, sub, tone, extra }: { href: string; icon: string; title: ReactNode; sub?: ReactNode; tone: "bad" | "wait" | "info" | "ok"; extra?: ReactNode }) {
  const toneCls = { bad: "border-bad/40 bg-bad-soft", wait: "border-wait-bg/50 bg-wait-soft", info: "border-line bg-card", ok: "border-ok/30 bg-ok-soft" }[tone];
  return (
    <Link href={href} className={clsx("flex min-h-20 items-center gap-3 rounded-2xl border-2 p-4", toneCls)}>
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold leading-tight">{title}</span>
        {sub && <span className="mt-0.5 block text-sm text-ink-2">{sub}</span>}
        {extra && <span className="mt-1 block">{extra}</span>}
      </span>
      <span className="text-2xl text-ink-2" aria-hidden>
        ›
      </span>
    </Link>
  );
}
