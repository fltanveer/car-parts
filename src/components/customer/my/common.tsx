"use client";

import { LogIn } from "lucide-react";
import { DEMO_PHONE } from "@/lib/db/seed";
import { useDb, useHydrated } from "@/lib/db/store";
import { displayPhone } from "@/lib/format";
import { useT } from "../../providers/LangProvider";
import { ButtonLink, Card } from "../../ui/primitives";
import { getGuestPhone } from "./customerActions";

/** Logged-in phone, or the guest phone remembered on this device. */
export function useMyPhone() {
  const session = useDb((s) => s.session.customerPhone);
  const hydrated = useHydrated();
  const guest = hydrated ? getGuestPhone() : null;
  return { phone: session ?? guest, loggedIn: !!session, sessionPhone: session };
}

/** Rule 8: ask for login only when it's really needed, and explain why. */
export function LoginNeeded({ next, why }: { next: string; why?: string }) {
  const { tx, d } = useT();
  return (
    <Card className="space-y-3 p-5 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-2xl">🔐</span>
      <p className="text-lg font-bold">{tx("লগইন করুন", "Please log in")}</p>
      <p className="text-muted">{why ?? tx("আপনার অর্ডার ও মেসেজ দেখতে ফোন নম্বর দিয়ে লগইন করুন।", "Log in with your phone number to see your orders and messages.")}</p>
      <ButtonLink href={`/login?next=${encodeURIComponent(next)}`} variant="brand" size="lg" full>
        <LogIn className="size-5" aria-hidden /> {tx("ফোন নম্বর দিয়ে লগইন", "Log in with phone")}
      </ButtonLink>
      <p className="text-sm text-muted">
        {tx("ডেমো নম্বর:", "Demo number:")} <b className="tabular-nums">{d(displayPhone(DEMO_PHONE))}</b> · {tx("OTP: যেকোনো ৬ সংখ্যা", "OTP: any 6 digits")}
      </p>
    </Card>
  );
}

/** Small "type" emoji tile used on my-stuff and message cards. */
export function TypeIcon({ icon, tone = "info" }: { icon: string; tone?: "ok" | "wait" | "bad" | "info" }) {
  const bg = { ok: "bg-ok-soft", wait: "bg-wait-soft", bad: "bg-bad-soft", info: "bg-surface" }[tone];
  return (
    <span className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl ${bg}`} aria-hidden>
      {icon}
    </span>
  );
}
