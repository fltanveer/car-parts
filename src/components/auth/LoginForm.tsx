"use client";

import { Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { normalizePhone, toEnDigits } from "@/lib/format";
import { telLink } from "@/lib/links";
import { login } from "@/lib/store";
import { useT } from "../providers/LangProvider";
import { Button, Field, Input } from "../ui/primitives";

// Spec 7.14: phone + 6-digit OTP, no password. Mock: any 6 digits work.
export function LoginForm({ onDone, initialPhone }: { onDone?: () => void; initialPhone?: string }) {
  const { tx, d } = useT();
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  // WebOTP auto-fill on Android Chrome.
  useEffect(() => {
    if (!sentTo || !("OTPCredential" in window)) return;
    const ac = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal } as CredentialRequestOptions)
      .then((c) => c && "code" in c && setOtp(String((c as { code: string }).code)))
      .catch(() => {});
    return () => ac.abort();
  }, [sentTo]);

  const send = () => {
    const p = normalizePhone(phone);
    if (!p) {
      setError(tx("সঠিক মোবাইল নম্বর দিন (যেমন 01711-000000)", "Enter a valid mobile number (e.g. 01711-000000)"));
      return;
    }
    setError(null);
    setSentTo(p);
    setWait(60);
    setTimeout(() => otpRef.current?.focus(), 50);
  };

  const verify = () => {
    const code = toEnDigits(otp).replace(/\D/g, "");
    if (code.length !== 6) {
      setError(tx("৬ সংখ্যার কোড দিন", "Enter the 6-digit code"));
      return;
    }
    login(sentTo!);
    onDone?.();
  };

  return (
    <div className="space-y-4">
      {!sentTo ? (
        <>
          <Field label={tx("মোবাইল নম্বর", "Mobile number")} error={error}>
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01XXX-XXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="text-xl tracking-wide"
            />
          </Field>
          <Button variant="primary" size="lg" full onClick={send}>
            {tx("কোড পাঠান", "Send code")}
          </Button>
        </>
      ) : (
        <>
          <p>
            {tx("কোড পাঠানো হয়েছে", "Code sent to")} <b>{d(sentTo.replace("+88", ""))}</b>{" "}
            <button type="button" className="font-semibold underline" onClick={() => setSentTo(null)}>
              {tx("নম্বর বদলান", "Change")}
            </button>
          </p>
          <Field label={tx("৬ সংখ্যার কোড", "6-digit code")} hint={tx("ডেমো: যেকোনো ৬ সংখ্যা দিন", "Demo: any 6 digits work")} error={error}>
            <Input
              ref={otpRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              className="text-center text-3xl font-bold tracking-[0.5em]"
            />
          </Field>
          <Button variant="primary" size="lg" full onClick={verify}>
            {tx("প্রবেশ করুন", "Verify")}
          </Button>
          <Button variant="ghost" full disabled={wait > 0} onClick={send}>
            {wait > 0 ? tx(`আবার পাঠানো যাবে ${d(wait)} সেকেন্ড পর`, `Resend in ${wait}s`) : tx("আবার কোড পাঠান", "Resend code")}
          </Button>
        </>
      )}
      <a href={telLink()} className="flex items-center justify-center gap-2 text-sm font-semibold text-q-oem">
        <Phone className="size-4" /> {tx("কোড পাচ্ছেন না? কল করুন", "No code? Call us")}
      </a>
    </div>
  );
}
