"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminPage, KV, Panel } from "@/components/admin/core";
import { AddressForm, type AddressDraft, emptyAddress, PaymentChooser } from "@/components/admin/core/orders/new/AddressPayment";
import { CartReview, type PhoneCartLine, useVendorGroups } from "@/components/admin/core/orders/new/CartReview";
import { CustomerLookup, useCustomerInfo } from "@/components/admin/core/orders/new/CustomerLookup";
import { ListingSearch } from "@/components/admin/core/orders/new/ListingSearch";
import { placePhoneOrder } from "@/components/admin/core/orders/new/placePhoneOrder";
import { useT } from "@/components/providers/LangProvider";
import { toast } from "@/components/shared/Misc";
import { Button, Notice, Select } from "@/components/ui/primitives";
import { useAdminSettings } from "@/lib/db/actions-admin-core";
import { getPaymentOptions } from "@/lib/rules";
import type { Fulfillment, PaymentMethod } from "@/lib/types";

export default function PhoneOrderPage() {
  const { tx, taka } = useT();
  const router = useRouter();
  const cfg = useAdminSettings();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [cart, setCart] = useState<PhoneCartLine[]>([]);
  const [ful, setFul] = useState<Record<string, Fulfillment>>({});
  const [addr, setAddr] = useState<AddressDraft>(() => emptyAddress(""));
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [trx, setTrx] = useState("");
  const [sender, setSender] = useState("");
  const [error, setError] = useState<string | null>(null);

  const info = useCustomerInfo(phone);
  const groups = useVendorGroups(cart, ful, addr.district);
  const subtotal = groups.reduce((t, g) => t + g.subtotal, 0);
  const deliveryTotal = groups.reduce((t, g) => t + g.delivery, 0);
  const total = subtotal + deliveryTotal;
  const options = groups.length
    ? getPaymentOptions({ total, deliveryTotal, isNewCustomer: info.isNew, forceAdvance: info.forceAdvance, storePickupOnly: groups.every((g) => g.fulfillment === "store_pickup") })
    : [];
  const chosen = options.find((o) => o.method === method) ?? null;
  const addressOk = addr.recipient_name.trim().length > 1 && addr.address_line.trim().length > 3 && addr.phone.trim().length > 5;
  const belowMin = subtotal > 0 && subtotal < cfg.min_order_value;
  const ready = !!info.phone && !info.blocked && groups.length > 0 && addressOk && !!chosen;

  const add = (id: string) => setCart((c) => (c.some((x) => x.listingId === id) ? c.map((x) => (x.listingId === id ? { ...x, qty: x.qty + 1 } : x)) : [...c, { listingId: id, qty: 1 }]));
  const setQty = (id: string, qty: number) => setCart((c) => (qty <= 0 ? c.filter((x) => x.listingId !== id) : c.map((x) => (x.listingId === id ? { ...x, qty } : x))));

  const submit = () => {
    if (!ready || !info.phone || !chosen) return;
    const res = placePhoneOrder({
      phone: info.phone, name: name.trim(), address: { ...addr, phone: addr.phone || info.phone }, lines: cart,
      fulfillment: Object.fromEntries(groups.map((g) => [g.vendor.id, g.fulfillment])), paymentMethod: chosen.method, advance: chosen.advance,
      userVehicleId: vehicleId || null, trx: trx.trim().length >= 6 ? { id: trx.trim(), sender: sender.trim() || info.phone } : null,
    });
    if ("error" in res) {
      setError(res.error === "advance_cap" ? tx("অগ্রিম আইনি ১০% সীমার বেশি", "Advance exceeds the legal 10% cap") : res.error);
      return;
    }
    toast(tx(`অর্ডার ${res.order_no} তৈরি হয়েছে`, `Order ${res.order_no} created`));
    router.push(`/admin/orders/${res.id}`);
  };

  return (
    <AdminPage
      back="/admin/orders"
      title={tx("ফোনে অর্ডার এন্ট্রি", "Phone order entry")}
      subtitle={tx("ফোন বা WhatsApp-এ আসা কাস্টমারের হয়ে অর্ডার", "Order on behalf of a caller / WhatsApp customer")}
      guide={tx(
        "প্রথমে কাস্টমারের ফোন নম্বর লিখুন। তারপর পণ্য খুঁজে কার্টে যোগ করুন, যেকোনো দোকানের পণ্য নেওয়া যাবে। ঠিকানা ও পেমেন্ট বেছে নিচের সবুজ বোতাম চাপুন। কাস্টমারকে SMS যাবে।",
        "Enter the customer's phone first. Search items from any seller and add them, then pick the address and payment and press the green button. The customer gets an SMS.",
      )}
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <CustomerLookup phone={phone} setPhone={(v) => { setPhone(v); if (!addr.phone || addr.phone === phone) setAddr((a) => ({ ...a, phone: v })); }} name={name} setName={setName} info={info} />
          <ListingSearch vehicles={info.vehicles} onAdd={add} inCart={(id) => cart.find((x) => x.listingId === id)?.qty ?? 0} />
        </div>
        <div className="space-y-4">
          <CartReview groups={groups} setQty={setQty} setFulfillment={(v, f) => setFul((x) => ({ ...x, [v]: f }))} />
          <AddressForm phone={info.phone} value={addr} onChange={setAddr} />
          {groups.length > 0 && <PaymentChooser options={options} value={method} onChange={setMethod} trx={trx} setTrx={setTrx} sender={sender} setSender={setSender} />}
          <Panel title={tx("৬. নিশ্চিত করুন", "6. Confirm")}>
            {info.vehicles.length > 0 && (
              <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="mb-3">
                <option value="">{tx("কাস্টমারের গাড়ি (ঐচ্ছিক)", "Customer's car (optional)")}</option>
                {info.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </Select>
            )}
            <KV
              rows={[
                [tx("পণ্য", "Items"), taka(subtotal)],
                [tx("ডেলিভারি", "Delivery"), taka(deliveryTotal)],
                [tx("মোট", "Total"), <b key="t" className="text-lg">{taka(total)}</b>],
                [tx("এখন নিতে হবে", "Collect now"), chosen ? taka(chosen.advance) : "—"],
              ]}
            />
            {belowMin && <Notice tone="wait" className="mt-3">{tx(`ন্যূনতম অর্ডার ${taka(cfg.min_order_value)}; ছোট অর্ডারে বাড়তি চার্জ লাগতে পারে।`, `Minimum order ${taka(cfg.min_order_value)}; small orders may carry a surcharge.`)}</Notice>}
            {error && <Notice tone="bad" className="mt-3">{error}</Notice>}
            <Button full size="lg" variant="ok" className="mt-3" disabled={!ready} onClick={submit}>
              <CheckCircle2 className="size-5" /> {tx("অর্ডার তৈরি করুন ও SMS পাঠান", "Create order & send SMS")}
            </Button>
          </Panel>
        </div>
      </div>
    </AdminPage>
  );
}
