"use client";

import { MapPin, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptQuote, saveAddress, useStore } from "@/lib/store";
import type { Address, PartRequest, RequestQuote } from "@/lib/types";
import { AddressForm } from "../auth/AddressForm";
import { LoginForm } from "../auth/LoginForm";
import { QualityBadge } from "../part/QualityBadge";
import { useT } from "../providers/LangProvider";
import { Button, ChoiceCard, Notice } from "../ui/primitives";
import { Sheet } from "./Sheet";

// "এটা নেবো" -> login (if needed) -> confirm address -> advance payment page.
export function AcceptSheet({ request, quote, onClose }: { request: PartRequest; quote: RequestQuote | null; onClose: () => void }) {
  const { tx, lang, taka, d } = useT();
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const addresses = useStore((s) => s.addresses);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedId = chosenId ?? (addresses.find((a) => a.is_default) ?? addresses[0])?.id ?? null;
  const showForm = adding || addresses.length === 0;

  const finish = (address: Address) => {
    if (!quote) return;
    const order = acceptQuote(request.id, quote.id, address);
    if (!order) {
      setError(tx("কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন", "Something went wrong, please try again"));
      return;
    }
    router.push(`/checkout/payment/${order.id}`);
  };

  return (
    <Sheet open={!!quote} onClose={onClose} title={tx("এটা নেবো", "I'll take this")}>
      {quote && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-3">
            <div className="min-w-0">
              <QualityBadge quality={quote.quality} lang={lang} />
              <p className="mt-1 truncate font-semibold">
                {quote.brand} · {quote.title}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xl font-bold">{taka(quote.price)}</p>
              <p className="text-xs text-muted">
                {tx("অগ্রিম", "Advance")} {taka(quote.advance_amount)}
              </p>
            </div>
          </div>

          {!profile ? (
            <div className="space-y-3">
              <p className="font-semibold">
                {tx("অর্ডার করতে একবার লগইন করুন। শুধু ফোন নম্বর আর SMS কোড লাগবে।", "Log in once to order. Just your phone number and an SMS code.")}
              </p>
              <LoginForm initialPhone={request.guest_phone?.replace("+88", "") ?? ""} />
            </div>
          ) : (
            <>
              <section className="space-y-2">
                <h3 className="flex items-center gap-2 font-bold">
                  <MapPin className="size-5" aria-hidden /> {tx("কোথায় পাঠাবো?", "Where should we deliver?")}
                </h3>
                {!showForm && (
                  <>
                    {addresses.map((a) => (
                      <ChoiceCard
                        key={a.id}
                        selected={a.id === selectedId}
                        onClick={() => setChosenId(a.id)}
                        title={`${a.recipient_name} · ${d(a.phone.replace("+88", ""))}`}
                        subtitle={`${a.address_line}, ${a.area}, ${a.district}`}
                      />
                    ))}
                    <Button variant="ghost" full onClick={() => setAdding(true)}>
                      <Plus className="size-5" /> {tx("নতুন ঠিকানা দিন", "Add a new address")}
                    </Button>
                  </>
                )}
                {showForm && (
                  <>
                    {addresses.length > 0 && (
                      <Button variant="ghost" onClick={() => setAdding(false)}>
                        {tx("← সেভ করা ঠিকানা থেকে বেছে নিন", "← Choose a saved address")}
                      </Button>
                    )}
                    <AddressForm
                      defaultPhone={profile.phone}
                      submitLabel={tx("এই ঠিকানায় পাঠান, অগ্রিম দিতে যান", "Deliver here, continue to advance payment")}
                      onSubmit={(draft) => {
                        const id = saveAddress(draft);
                        finish({ ...draft, id });
                      }}
                    />
                  </>
                )}
              </section>

              <Notice tone="info">
                <ul className="list-disc space-y-1 pl-4">
                  <li>
                    {tx(
                      `এখন অগ্রিম ${taka(quote.advance_amount)} (${d(quote.advance_percent)}%) bKash / Nagad-এ দিতে হবে। বাকি টাকা পার্ট হাতে পেলে।`,
                      `Pay ${taka(quote.advance_amount)} (${quote.advance_percent}%) advance by bKash / Nagad now; the rest on delivery.`,
                    )}
                  </li>
                  <li>{tx("আনিয়ে দিতে না পারলে পুরো অগ্রিম ফেরত দেবো।", "If we can't get the part, the full advance is refunded.")}</li>
                  <li>{tx("পার্ট সংগ্রহ শুরুর পর বাতিল করলে অগ্রিম ফেরত হবে না।", "If you cancel after sourcing starts, the advance is not refunded.")}</li>
                  <li>{tx("ডেলিভারি চার্জ পরের পেজে দেখাবে।", "Delivery charge is shown on the next page.")}</li>
                </ul>
              </Notice>

              {error && <Notice tone="danger">{error}</Notice>}

              {!showForm && (
                <Button
                  variant="primary"
                  size="lg"
                  full
                  disabled={!selectedId}
                  onClick={() => {
                    const a = addresses.find((x) => x.id === selectedId);
                    if (a) finish(a);
                  }}
                >
                  {tx("ঠিকানা ঠিক আছে, অগ্রিম দিতে যান", "Address OK, go to advance payment")}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
