"use client";

import { CheckCircle2, PhoneCall } from "lucide-react";
import { useState } from "react";
import { requestCallback } from "@/lib/db/actions";
import { displayPhone, normalizePhone, toEnDigits } from "@/lib/format";
import { telLink } from "@/lib/links";
import { toast } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, Field, Input, Notice } from "@/components/ui/primitives";
import { loginAndClaim } from "./actions";

/** Phone + OTP inside checkout (mock: any 6 digits), or "call to order" (file 01 6.2 step 1). */
export function LoginInline({ phone, context }: { phone: string | null; context: string }) {
  const { tx, d } = useT();
  const [input, setInput] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (phone) {
    return (
      <p className="flex items-center gap-2 font-semibold text-ok">
        <CheckCircle2 className="size-5" aria-hidden /> {tx("লগইন করা আছে", "Logged in")}: {d(displayPhone(phone))}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!sentTo ? (
        <>
          <Field label={tx("আপনার মোবাইল নম্বর", "Your mobile number")} error={err}>
            <Input inputMode="tel" autoComplete="tel" value={input} onChange={(e) => { setInput(e.target.value); setErr(null); }} placeholder="01XXXXXXXXX" />
          </Field>
          <Button
            variant="brand"
            size="lg"
            full
            onClick={() => {
              const p = normalizePhone(input);
              if (!p) return setErr(tx("সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)", "Enter a valid 11-digit mobile number"));
              setSentTo(p);
              toast(tx("কোড পাঠানো হয়েছে (ডেমো: যেকোনো ৬ সংখ্যা)", "Code sent (demo: any 6 digits)"), "info");
            }}
          >
            {tx("কোড পাঠান", "Send code")}
          </Button>
        </>
      ) : (
        <>
          <Field label={tx(`${d(displayPhone(sentTo))} নম্বরে আসা ৬ সংখ্যার কোড`, `6-digit code sent to ${displayPhone(sentTo)}`)} hint={tx("ডেমো: যেকোনো ৬ সংখ্যা দিন", "Demo: any 6 digits")} error={err}>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => { setOtp(toEnDigits(e.target.value).replace(/\D/g, "").slice(0, 6)); setErr(null); }}
              className="text-center text-2xl tracking-[0.5em]"
            />
          </Field>
          <Button
            variant="ok"
            size="lg"
            full
            disabled={otp.length !== 6}
            onClick={() => {
              loginAndClaim(sentTo);
              toast(tx("লগইন হয়েছে", "Logged in"));
            }}
          >
            {tx("নিশ্চিত করুন", "Verify")}
          </Button>
          <button type="button" className="min-h-11 text-sm font-semibold text-brand" onClick={() => { setSentTo(null); setOtp(""); }}>
            {tx("নম্বর বদলান", "Change number")}
          </button>
        </>
      )}
      <Notice>
        <p className="mb-2">{tx("অ্যাপে কঠিন লাগছে? ফোনে অর্ডার দিন, আমরা লিখে নেবো।", "Finding it hard? Order by phone, we'll take it down.")}</p>
        <a
          href={telLink()}
          onClick={() => requestCallback("support", null, context)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ok px-4 font-semibold text-white"
        >
          <PhoneCall className="size-5" aria-hidden /> {tx("কল করে অর্ডার দিন", "Call to order")}
        </a>
      </Notice>
    </div>
  );
}
