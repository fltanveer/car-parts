"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { orderById, vendorOrderById } from "@/lib/db/queries";
import { useDb, useHydrated } from "@/lib/db/store";
import { AudioGuide } from "../../layout/AudioGuide";
import { BackButton, HelpCall, useNow } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, ButtonLink, Container, EmptyState, PageHeader, SectionTitle } from "../../ui/primitives";
import { ClaimForm } from "./ClaimForm";
import { ClaimStatusCard } from "./ClaimStatusCard";
import { LoginNeeded } from "./common";

/** /my/orders/[id]/claim: existing claims + report a new problem (file 01 §7.2). */
export function ClaimCenter({ orderId }: { orderId: string }) {
  const { tx, d } = useT();
  const hydrated = useHydrated();
  const now = useNow();
  const db = useDb((s) => s);
  const [formOpen, setFormOpen] = useState<boolean | null>(null);
  if (!hydrated) return <Container className="h-96 animate-pulse" />;
  const phone = db.session.customerPhone;
  if (!phone)
    return (
      <Container>
        <BackButton href="/my" />
        <LoginNeeded next={`/my/orders/${orderId}/claim`} />
      </Container>
    );
  const order = orderById(db, orderId);
  if (!order || order.user_phone !== phone)
    return (
      <Container>
        <BackButton href="/my" />
        <EmptyState icon="🔎" title={tx("অর্ডার পাওয়া যায়নি", "Order not found")} action={<ButtonLink href="/my">{tx("আমার কাজ", "My stuff")}</ButtonLink>} />
      </Container>
    );
  const vos = order.vendor_order_ids.map((v) => vendorOrderById(db, v)).filter((v) => !!v);
  const delivered = vos.filter((v) => ["delivered", "completed", "return_requested"].includes(v.status));
  const claims = db.claims.filter((c) => order.vendor_order_ids.includes(c.vendor_order_id));
  const showForm = formOpen ?? claims.length === 0;

  return (
    <Container className="space-y-5">
      <PageHeader
        back={<BackButton href={`/my/orders/${order.id}`} />}
        title={`⚠️ ${tx("সমস্যা জানান", "Report a problem")}`}
        subtitle={tx(`অর্ডার ${d(order.order_no)}`, `Order ${order.order_no}`)}
      />
      <AudioGuide
        text={tx(
          "কোন জিনিসে সমস্যা বাছুন, তারপর কী সমস্যা বাছুন, আর ছবি তুলে দিন। দোকান উত্তর না দিলে আমরা নিজে দেখবো। সমাধান না হওয়া পর্যন্ত দোকান টাকা পাবে না।",
          "Pick the item, then the problem, and add photos. If the shop doesn't reply we will step in. The shop isn't paid until it's solved.",
        )}
      />

      {claims.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>{tx("আপনার জানানো সমস্যা", "Your reported problems")}</SectionTitle>
          {claims.map((c) => (
            <ClaimStatusCard key={c.id} claim={c} vo={vendorOrderById(db, c.vendor_order_id)} />
          ))}
        </section>
      )}

      {showForm ? (
        <ClaimForm parcels={delivered} now={now} onDone={() => setFormOpen(false)} />
      ) : (
        <Button variant="outline" size="lg" full onClick={() => setFormOpen(true)}>
          <Plus className="size-5" aria-hidden /> {tx("নতুন সমস্যা জানান", "Report another problem")}
        </Button>
      )}
      <HelpCall text={tx("বুঝতে সমস্যা? আমাদের কল করুন", "Confused? Call us")} />
    </Container>
  );
}
