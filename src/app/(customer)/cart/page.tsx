"use client";

import { ArrowRight, ShoppingCart } from "lucide-react";
import type { DB } from "@/lib/db/seed";
import { addToCart, setCartQty } from "@/lib/db/actions";
import { useDb, useHydrated } from "@/lib/db/store";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { BackButton, HelpCall, toast } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, ButtonLink, Container, EmptyState, Notice, PageHeader } from "@/components/ui/primitives";
import { cartGroups, cartTotals, groupDelivery, sameShopAlternatives } from "@/components/customer/shop/cart";
import { CartGroup } from "@/components/customer/shop/CartGroup";
import { homeDistrict } from "@/components/customer/shop/data";
import { RequestPromptCard } from "@/components/customer/shop/RequestPromptCard";

const whole = (s: DB) => s;

/** Multi-shop cart grouped by shop (file 01 6.1). */
export default function CartPage() {
  const { tx, taka, d, lang } = useT();
  const hydrated = useHydrated();
  const s = useDb(whole);
  const district = homeDistrict(s);
  const groups = cartGroups(s);
  const totals = cartTotals(s, groups, {}, district);
  const alts = sameShopAlternatives(s, groups);
  const canCheckout = groups.some((g) => g.rows.some((r) => r.available));

  if (hydrated && !groups.length) {
    return (
      <Container className="space-y-4">
        <PageHeader back={<BackButton />} title={tx("কার্ট", "Cart")} />
        <EmptyState
          icon={<ShoppingCart className="size-7" />}
          title={tx("কার্ট খালি", "Your cart is empty")}
          body={tx("পার্টস খুঁজে 'কার্টে দিন' চাপুন।", "Find parts and tap 'Add to cart'.")}
          action={<ButtonLink href="/search" variant="brand" size="lg">{tx("পার্টস খুঁজুন", "Find parts")}</ButtonLink>}
        />
        <RequestPromptCard />
        <HelpCall />
      </Container>
    );
  }

  return (
    <Container className="space-y-4">
      <PageHeader back={<BackButton />} title={tx("কার্ট", "Cart")} subtitle={tx(`${d(groups.length)}টা দোকান · ${d(groups.reduce((n, g) => n + g.rows.length, 0))}টা জিনিস`, `${groups.length} shops · ${groups.reduce((n, g) => n + g.rows.length, 0)} items`)}>
        <AudioGuide compact text={tx("প্রতিটা দোকানের জিনিস আলাদা প্যাকেটে আসবে, প্রতিটা প্যাকেটে আলাদা ডেলিভারি চার্জ। সংখ্যা বাড়াতে প্লাস চাপুন। সব ঠিক থাকলে নিচের বড় বাটন চাপুন।", "Each shop sends a separate parcel with its own delivery charge. Tap plus to add more. When ready, tap the big button below.")} />
      </PageHeader>

      {groups.length > 1 && (
        <Notice tone="wait">
          📦 {tx(`${d(groups.length)}টা দোকান = ${d(groups.length)}টা আলাদা প্যাকেট, ${d(groups.length)} বার ডেলিভারি চার্জ।`, `${groups.length} shops = ${groups.length} parcels, ${groups.length} delivery charges.`)}
          {alts.length > 0 && <span className="block">{tx("একই দোকানে বিকল্প আছে, নিচে দেখুন।", "Same-shop alternatives below.")}</span>}
        </Notice>
      )}

      {alts.map(({ row, alt, altVendor }) => (
        <div key={`${row.index}-${alt.id}`} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-brand/30 bg-brand-soft/30 p-3">
          <p className="min-w-0 flex-1 text-sm">
            <b>{lang === "bn" ? alt.title_bn : alt.title}</b> {tx(`${altVendor.shop_name_bn}-এও আছে`, `is also at ${altVendor.shop_name}`)} · {taka(alt.price)}
          </p>
          <Button
            variant="brand"
            size="sm"
            onClick={() => {
              setCartQty(row.index, 0);
              addToCart({ listing_id: alt.id }, row.qty);
              toast(tx("একই দোকানে নেওয়া হলো, এক প্যাকেট কম", "Moved to the same shop — one parcel fewer"));
            }}
          >
            {tx("এখান থেকে নিন", "Take from here")}
          </Button>
        </div>
      ))}

      <div className="space-y-3">
        {groups.map((g, i) => (
          <CartGroup key={g.vendor.id} group={g} index={i} delivery={groupDelivery(g, district)} />
        ))}
      </div>

      <section className="rounded-2xl border border-line bg-card p-4">
        <dl className="space-y-1.5">
          <div className="flex justify-between"><dt className="text-ink-2">{tx("জিনিসের দাম", "Items")}</dt><dd className="font-semibold">{taka(totals.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-2">{tx(`ডেলিভারি (${d(groups.length)} প্যাকেট)`, `Delivery (${groups.length} parcels)`)}</dt><dd className="font-semibold">{taka(totals.delivery)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 text-lg"><dt className="font-bold">{tx("মোট", "Total")}</dt><dd className="font-bold">{taka(totals.total)}</dd></div>
        </dl>
        <p className="mt-1 text-xs text-muted">{tx(`ডেলিভারি চার্জ ${district} ঠিকানা ধরে; চেকআউটে ঠিকানা বদলালে বদলাতে পারে।`, `Delivery estimated for ${district}; may change with your address at checkout.`)}</p>
      </section>

      <ButtonLink href="/checkout" variant="ok" size="xl" full aria-disabled={!canCheckout} className={canCheckout ? "" : "pointer-events-none opacity-50"}>
        {tx("অর্ডার করতে এগিয়ে যান", "Continue to checkout")} <ArrowRight className="size-6" aria-hidden />
      </ButtonLink>
      <HelpCall />
    </Container>
  );
}
