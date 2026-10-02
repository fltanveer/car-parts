"use client";

import clsx from "clsx";
import { ChevronRight, ClipboardList, Package, SearchCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RequireLogin } from "@/components/auth/RequireLogin";
import { advanceDue, hasPendingPayment, orderBucket, requestBucket, type Bucket } from "@/components/orders/helpers";
import { useT } from "@/components/providers/LangProvider";
import { ButtonLink, Card, Chip, Container, PageHeader } from "@/components/ui/primitives";
import { orderStatusLabel, requestStatusLabel } from "@/lib/i18n";
import { useStore } from "@/lib/store";

type Tab = "all" | Bucket;

interface Row {
  kind: "order" | "request";
  id: string;
  no: string;
  created_at: string;
  href: string;
  title: string;
  status: { bn: string; en: string };
  bucket: Bucket;
  amount: number | null;
  action: { bn: string; en: string } | null;
}

export default function OrdersPage() {
  const { tx } = useT();
  return (
    <RequireLogin reason={tx("আপনার অর্ডার দেখতে লগইন করুন", "Log in to see your orders")}>
      <OrdersList />
    </RequireLogin>
  );
}

function OrdersList() {
  const { tx, lang, taka, d, date } = useT();
  const orders = useStore((s) => s.orders);
  const requests = useStore((s) => s.requests);
  const [tab, setTab] = useState<Tab>("all");

  // Spec 7.12: orders and requests in one list. A request that already turned
  // into an order is represented by that order.
  const rows = useMemo<Row[]>(() => {
    const orderIds = new Set(orders.map((o) => o.id));
    const out: Row[] = orders.map((o) => {
      const due = advanceDue(o);
      return {
        kind: "order",
        id: o.id,
        no: o.order_no,
        created_at: o.created_at,
        href: `/orders/${o.id}`,
        title: o.items[0]?.title_snapshot + (o.items.length > 1 ? (lang === "bn" ? ` +আরও ${d(o.items.length - 1)}টি` : ` +${o.items.length - 1} more`) : ""),
        status: orderStatusLabel[o.status],
        bucket: orderBucket(o.status),
        amount: o.total,
        action:
          o.status === "advance_pending" && due > 0 && !hasPendingPayment(o)
            ? { bn: "অগ্রিম দিন", en: "Pay advance" }
            : o.status === "shipped"
              ? { bn: "ট্র্যাক করুন", en: "Track" }
              : null,
      };
    });
    for (const r of requests) {
      if (r.order_id && orderIds.has(r.order_id)) continue;
      out.push({
        kind: "request",
        id: r.id,
        no: r.request_no,
        created_at: r.created_at,
        href: `/request/${r.id}`,
        title: r.description_text || (r.voice_notes.length ? tx("ভয়েসে বলা রিকোয়েস্ট", "Voice request") : tx("ছবি দিয়ে রিকোয়েস্ট", "Photo request")),
        status: requestStatusLabel[r.status],
        bucket: requestBucket(r),
        amount: null,
        action: r.status === "quoted" ? { bn: "দাম দেখুন", en: "See prices" } : null,
      });
    }
    return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [orders, requests, lang, tx, d]);

  const tabs: { id: Tab; bn: string; en: string }[] = [
    { id: "all", bn: "সব", en: "All" },
    { id: "active", bn: "চলমান", en: "Active" },
    { id: "done", bn: "সম্পন্ন", en: "Completed" },
    { id: "cancelled", bn: "বাতিল", en: "Cancelled" },
  ];
  const count = (t: Tab) => (t === "all" ? rows.length : rows.filter((r) => r.bucket === t).length);
  const shown = tab === "all" ? rows : rows.filter((r) => r.bucket === tab);

  return (
    <Container>
      <PageHeader title={tx("আমার অর্ডার", "My orders")} subtitle={tx("অর্ডার আর পার্টের রিকোয়েস্ট এক জায়গায়", "Orders and part requests in one place")} />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4" role="tablist">
        {tabs.map((t) => (
          <Chip key={t.id} role="tab" aria-selected={tab === t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t[lang]} <span className={clsx("tabular-nums", tab === t.id ? "text-white/70" : "text-muted")}>{d(count(t.id))}</span>
          </Chip>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card className="p-6 text-center">
          <ClipboardList className="mx-auto size-10 text-muted" aria-hidden />
          <p className="mt-3 font-semibold">{tx("এখানে কিছু নেই", "Nothing here yet")}</p>
          <div className="mt-4 space-y-2">
            <ButtonLink href="/search" variant="primary" size="lg" full>
              {tx("পার্ট খুঁজুন", "Search parts")}
            </ButtonLink>
            <ButtonLink href="/request" variant="outline" size="lg" full>
              {tx("পার্ট চাই (রিকোয়েস্ট)", "Request a part")}
            </ButtonLink>
          </div>
        </Card>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={`${r.kind}-${r.id}`}>
              <Link href={r.href} className="block rounded-2xl border border-line bg-card p-4 transition-colors hover:border-ink/30">
                <div className="flex items-start gap-3">
                  <span
                    className={clsx(
                      "grid size-11 shrink-0 place-items-center rounded-xl",
                      r.kind === "order" ? "bg-ink text-white" : "bg-accent-soft text-accent-ink",
                    )}
                    aria-hidden
                  >
                    {r.kind === "order" ? <Package className="size-5" /> : <SearchCheck className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-sm">
                      <span className="font-bold">{d(r.no)}</span>
                      <span className="text-muted">
                        · {r.kind === "order" ? tx("অর্ডার", "Order") : tx("রিকোয়েস্ট", "Request")} · {date(r.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 font-semibold">{r.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={clsx(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          r.bucket === "done" && "bg-q-genuine-soft text-q-genuine",
                          r.bucket === "active" && "bg-q-oem-soft text-q-oem",
                          r.bucket === "cancelled" && "bg-line text-ink-2",
                        )}
                      >
                        {r.status[lang]}
                      </span>
                      {r.action && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-ink">{r.action[lang]} →</span>}
                      {r.amount != null && <span className="ml-auto font-bold">{taka(r.amount)}</span>}
                    </div>
                  </div>
                  <ChevronRight className="mt-3 size-5 shrink-0 text-muted" aria-hidden />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
