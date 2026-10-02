"use client";

import { ArrowRight, Phone, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { loginCustomer } from "@/lib/db/actions";
import { DEMO_PHONE } from "@/lib/db/seed";
import { displayPhone, normalizePhone, toEnDigits } from "@/lib/format";
import { telLink } from "@/lib/links";
import { AudioGuide } from "../../layout/AudioGuide";
import { BackButton, HelpCall, toast, useNow } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, Container, Field, Input, Notice, PageHeader } from "../../ui/primitives";

const RESEND_SECONDS = 30;

/** /login?next=: phone + OTP (mock: any 6 digits) (file 01 §12). */
export function LoginFlow() {
  const { tx, d } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sentAt, setSentAt] = useState<number | null>(null);
  const now = useNow(1000);
  const normalized = normalizePhone(phone);
  const wait = sentAt ? Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000)) : 0;

  const sendOtp = () => {
    if (!normalized) return;
    setSentAt(Date.now());
    setOtp("");
    toast(tx("OTP পাঠানো হয়েছে (ডেমো: যেকোনো ৬ সংখ্যা)", "OTP sent (demo: any 6 digits)"), "info");
  };
  const verify = () => {
    if (!normalized || toEnDigits(otp).replace(/\D/g, "").length !== 6) return;
    loginCustomer(normalized);
    toast(tx("লগইন হয়েছে", "Logged in"));
    router.replace(next);
  };

  return (
    <Container className="max-w-md space-y-5">
      <PageHeader back={<BackButton />} title={`🔐 ${tx("লগইন", "Log in")}`} subtitle={tx("পাসওয়ার্ড লাগবে না। ফোনে আসা কোড দিন।", "No password. Just the code sent to your phone.")} />
      <AudioGuide text={sentAt ? tx("আপনার ফোনে ছয় সংখ্যার একটা কোড গেছে। সেটা লিখে সবুজ বাটন চাপুন।", "A six-digit code was sent to your phone. Type it and press the green button.") : tx("আপনার মোবাইল নম্বর লিখে 'কোড পাঠান' চাপুন।", "Type your mobile number and press 'Send code'.")} />

      {!sentAt ? (
        <div className="space-y-4">
          <Field label={tx("📱 মোবাইল নম্বর", "📱 Mobile number")} error={phone.length >= 11 && !normalized ? tx("সঠিক নম্বর দিন (০১...)", "Enter a valid number (01…)") : undefined}>
            <Input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="text-xl tracking-wider" autoFocus />
          </Field>
          <Button variant="primary" size="lg" full disabled={!normalized} onClick={sendOtp}>
            {tx("কোড পাঠান", "Send code")} <ArrowRight className="size-5" aria-hidden />
          </Button>
          <Notice>
            🧪 {tx("ডেমো নম্বর", "Demo number")}: <button type="button" className="font-bold underline tabular-nums" onClick={() => setPhone(displayPhone(DEMO_PHONE))}>{d(displayPhone(DEMO_PHONE))}</button>
          </Notice>
        </div>
      ) : (
        <div className="space-y-4">
          <p>
            {tx("কোড পাঠানো হয়েছে", "Code sent to")} <b className="tabular-nums">{d(displayPhone(normalized!))}</b>{" "}
            <button type="button" className="font-semibold text-brand-ink underline" onClick={() => setSentAt(null)}>
              {tx("নম্বর বদলান", "Change")}
            </button>
          </p>
          <Field label={tx("🔢 ৬ সংখ্যার কোড", "🔢 6-digit code")}>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              className="text-center text-3xl tracking-[0.5em]"
              autoFocus
            />
          </Field>
          <Button variant="ok" size="lg" full disabled={toEnDigits(otp).replace(/\D/g, "").length !== 6} onClick={verify}>
            <ShieldCheck className="size-5" aria-hidden /> {tx("লগইন করুন", "Log in")}
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button type="button" disabled={wait > 0} onClick={sendOtp} className="min-h-11 font-semibold text-brand-ink disabled:text-muted">
              🔁 {wait > 0 ? tx(`আবার পাঠান (${d(wait)} সে.)`, `Resend (${wait}s)`) : tx("আবার পাঠান", "Resend")}
            </button>
            <a href={telLink()} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-ok">
              <Phone className="size-4" aria-hidden /> {tx("OTP পাচ্ছি না? কল করুন", "No OTP? Call us")}
            </a>
          </div>
        </div>
      )}
      <p className="text-center text-sm text-muted">{tx("লগইন ছাড়াই দেখা, খোঁজা আর পার্ট চাওয়া যায়।", "You can browse, search and request parts without logging in.")}</p>
      <HelpCall />
    </Container>
  );
}
