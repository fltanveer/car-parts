"use client";

import { RotateCcw, ShieldCheck, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { placeOrder } from "@/lib/db/actions";
import type { DB } from "@/lib/db/seed";
import { useDb, useHydrated } from "@/lib/db/store";
import { settings } from "@/lib/mock/settings";
import { getPaymentOptions, type PaymentOption } from "@/lib/rules";
import { warrantyLabel } from "@/lib/labels";
import type { Fulfillment } from "@/lib/types";
import { AudioGuide, SpeakButton } from "@/components/layout/AudioGuide";
import { BackButton, HelpCall, toast } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, ButtonLink, Container, EmptyState, Notice, PageHeader } from "@/components/ui/primitives";
import { AddressStep } from "@/components/customer/shop/AddressForm";
import { cartGroups, checkoutLines, groupDelivery } from "@/components/customer/shop/cart";
import { DeliveryStep, PaymentStep, StepBox } from "@/components/customer/shop/CheckoutSteps";
import { activeVehicleOf, myAddresses, myProfile } from "@/components/customer/shop/data";
import { LoginInline } from "@/components/customer/shop/LoginInline";

const whole = (s: DB) => s;

/** One-page checkout: login → address → delivery → payment → summary (file 01 6.2). */
export default function CheckoutPage() {
  const { tx, lang, taka, d } = useT();
  const router = useRouter();
  const hydrated = useHydrated();
  const s = useDb(whole);
  const phone = s.session.customerPhone;
  const profile = myProfile(s);
  const addresses = myAddresses(s);
  const groups = cartGroups(s).map((g) => ({ ...g, rows: g.rows.filter((r) => r.available) })).filter((g) => g.rows.length);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [fulfillment, setFulfillment] = useState<Record<string, Fulfillment>>({});
  const [sameForAll, setSameForAll] = useState(true);
  const [method, setMethod] = useState<PaymentOption["method"] | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const address = addresses.find((a) => a.id === addressId) ?? (addressId === null ? addresses.find((a) => a.is_default) ?? addresses[0] : undefined) ?? null;
  const district = address?.district ?? "ঢাকা";
  const fOf = (vid: string) => fulfillment[vid] ?? "platform_pickup";
  const subtotal = groups.reduce((t, g) => t + g.subtotal, 0);
  const deliveryTotal = groups.reduce((t, g) => t + groupDelivery(g, district, fOf(g.vendor.id)), 0);
  const total = subtotal + deliveryTotal;
  const options = getPaymentOptions({
    total,
    deliveryTotal,
    isNewCustomer: !!phone && !s.orders.some((o) => o.user_phone === phone),
    forceAdvance: !!profile?.force_advance,
    storePickupOnly: groups.every((g) => fOf(g.vendor.id) === "store_pickup"),
  });
  const option = options.find((o) => o.method === method) ?? null;
  const ready = !!phone && !!address && !!option && agreed;

  if (hydrated && !groups.length) {
    return (
      <Container className="space-y-4">
        <BackButton href="/cart" />
        <EmptyState icon={<ShoppingBag className="size-7" />} title={tx("কার্টে কিছু নেই", "Nothing to check out")} action={<ButtonLink href="/search" variant="brand" size="lg">{tx("পার্টস খুঁজুন", "Find parts")}</ButtonLink>} />
      </Container>
    );
  }

  const rulesText = tx(
    `ভুল বা ভাঙা জিনিস এলে পুরো টাকা ফেরত। ভাঙা জিনিস ${settings.damage_claim_hours} ঘণ্টার মধ্যে ছবিসহ জানাবেন। ফেরতযোগ্য জিনিস ${settings.return_window_days} দিনের মধ্যে, না লাগানো অবস্থায় ফেরত দেওয়া যাবে, মন বদলালে আসা-যাওয়ার খরচ আপনার। ইলেকট্রিক্যাল জিনিস লাগানোর পর মন বদলালে ফেরত হয় না। প্রতিটা দোকান ${settings.vendor_accept_hours} ঘণ্টার মধ্যে অর্ডার নিশ্চিত করবে।`,
    `Wrong or broken items are fully refunded. Report damage within ${settings.damage_claim_hours} hours with photos. Returnable items can be returned within ${settings.return_window_days} days unfitted; for change of mind you pay shipping. Electrical parts can't be returned for change of mind after fitting. Each shop confirms within ${settings.vendor_accept_hours} hours.`,
  );

  const submit = () => {
    if (!ready || !address || !option) return;
    setBusy(true);
    const res = placeOrder({
      lines: checkoutLines(groups),
      address,
      customerName: profile?.full_name ?? address.recipient_name,
      fulfillment: Object.fromEntries(groups.map((g) => [g.vendor.id, fOf(g.vendor.id)])),
      paymentMethod: option.method,
      advance: option.method === "online" ? 0 : option.advance,
      userVehicleId: activeVehicleOf(s)?.id ?? null,
      source: "cart",
    });
    if ("error" in res) {
      setBusy(false);
      toast(tx("অগ্রিম টাকার সীমা পার হয়েছে, অন্য পদ্ধতি বাছুন", "Advance is over the legal limit, choose another option"), "bad");
      return;
    }
    router.replace(option.method === "online" || option.advance > 0 ? `/checkout/pay/${res.id}` : `/checkout/done/${res.id}`);
  };

  return (
    <Container className="space-y-4">
      <PageHeader back={<BackButton href="/cart" />} title={tx("অর্ডার করুন", "Checkout")} subtitle={tx("ধাপে ধাপে, এক পেজে", "Step by step, one page")}>
        <AudioGuide compact text={tx("উপর থেকে নিচে একটা একটা করে ধাপ পূরণ করুন: মোবাইল নম্বর, ঠিকানা, কীভাবে পাবেন, কীভাবে টাকা দেবেন। শেষে নিয়মে টিক দিয়ে সবুজ বাটন চাপুন।", "Fill each step from top to bottom: mobile, address, delivery, payment. Then tick the rules and press the green button.")} />
      </PageHeader>

      <StepBox n={1} title={tx("মোবাইল নম্বর", "Mobile number")} done={!!phone}>
        <LoginInline phone={phone} context={tx("চেকআউট থেকে কল করে অর্ডার", "Order by phone from checkout")} />
      </StepBox>

      <StepBox n={2} title={tx("ঠিকানা", "Address")} done={!!phone && !!address} disabled={!phone}>
        <AddressStep value={address?.id ?? null} onChange={setAddressId} />
      </StepBox>

      <StepBox n={3} title={tx("কীভাবে পাবেন", "How you'll get it")} done={!!address} disabled={!phone || !address}>
        <DeliveryStep groups={groups} district={district} value={fulfillment} onChange={setFulfillment} sameForAll={sameForAll} onSameForAll={setSameForAll} />
      </StepBox>

      <StepBox n={4} title={tx("টাকা কীভাবে দেবেন", "Payment")} done={!!option} disabled={!phone || !address}>
        <PaymentStep options={options} value={option?.method ?? null} onChange={setMethod} />
        <p className="mt-2 text-xs text-muted">
          {tx(`অগ্রিম কখনো মোটের ${d(settings.manual_advance_max_percent)}% বা ডেলিভারি চার্জের বেশি নয় (আইন অনুযায়ী)।`, `Advance is never more than ${settings.manual_advance_max_percent}% of the total or the delivery charge (legal rule).`)}
        </p>
      </StepBox>

      <StepBox n={5} title={tx("সারাংশ", "Summary")} done={agreed} disabled={!phone || !address || !option}>
        <ul className="space-y-3">
          {groups.map((g, i) => (
            <li key={g.vendor.id} className="rounded-xl bg-surface p-3">
              <p className="font-semibold">📦 {tx(`প্যাকেট ${d(i + 1)}`, `Parcel ${i + 1}`)}: {lang === "bn" ? g.vendor.shop_name_bn : g.vendor.shop_name}</p>
              <ul className="mt-1 space-y-1.5 text-sm">
                {g.rows.map((r) => (
                  <li key={r.index} className="flex flex-wrap items-center justify-between gap-x-2">
                    <span className="min-w-0 flex-1">{r.title} × {d(r.qty)}</span>
                    <span className="font-semibold">{taka(r.price * r.qty)}</span>
                    <span className="flex w-full flex-wrap gap-2 text-xs text-ink-2">
                      <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5" aria-hidden />{warrantyLabel(r.listing?.warranty_days ?? r.quote?.warranty_days ?? 0, lang)}</span>
                      <span className="inline-flex items-center gap-1"><RotateCcw className="size-3.5" aria-hidden />{(r.listing?.is_returnable ?? r.quote?.is_returnable) ? tx("ফেরত যাবে", "Returnable") : tx("ফেরত নেই", "No returns")}</span>
                      {r.listing?.is_electrical && <span>⚡ {tx("ইলেকট্রিক্যাল", "Electrical")}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-right text-sm">{tx("ডেলিভারি", "Delivery")} {taka(groupDelivery(g, district, fOf(g.vendor.id)))}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1">
          <div className="flex justify-between"><dt>{tx("জিনিস", "Items")}</dt><dd>{taka(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>{tx("ডেলিভারি", "Delivery")}</dt><dd>{taka(deliveryTotal)}</dd></div>
          <div className="flex justify-between border-t border-line pt-1 text-lg font-bold"><dt>{tx("মোট", "Total")}</dt><dd>{taka(total)}</dd></div>
          {option && option.method !== "cod" && (
            <div className="flex justify-between font-semibold text-brand-ink"><dt>{tx("এখন দেবেন", "Pay now")}</dt><dd>{taka(option.method === "online" ? total : option.advance)}</dd></div>
          )}
        </dl>
        <label className="mt-4 flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 border-line p-3">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 size-6 shrink-0 accent-[var(--color-ok)]" />
          <span className="flex-1">
            <span className="block font-semibold">{tx("ফেরত ও ওয়ারেন্টির নিয়ম পড়েছি", "I've read the return & warranty rules")}</span>
            <span className="block text-sm text-ink-2">{rulesText}</span>
          </span>
        </label>
        <SpeakButton className="mt-2" text={rulesText} label={tx("নিয়ম শুনুন", "Hear the rules")} />
      </StepBox>

      {!ready && phone && address && !option && <Notice tone="wait">{tx("টাকা দেওয়ার পদ্ধতি বাছুন", "Choose a payment option")}</Notice>}
      <Button variant="ok" size="xl" full disabled={!ready || busy} onClick={submit}>
        ✅ {tx(`অর্ডার করুন · ${taka(total)}`, `Place order · ${taka(total)}`)}
      </Button>
      <HelpCall />
    </Container>
  );
}
