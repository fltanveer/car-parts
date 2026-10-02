"use client";

import { Check, Lock, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNext } from "@/components/garage/safeNext";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { useT } from "@/components/providers/LangProvider";
import { Card, Container } from "@/components/ui/primitives";
import { useHydrated, useStore } from "@/lib/store";

// Spec 7.14: phone + OTP only. Redirects to ?next= once logged in.
export default function LoginPage(props: PageProps<"/login">) {
  const sp = use(props.searchParams);
  const next = safeNext(sp.next);
  const { tx } = useT();
  const router = useRouter();
  const hydrated = useHydrated();
  const loggedIn = useStore((s) => !!s.profile);

  useEffect(() => {
    if (hydrated && loggedIn) router.replace(next);
  }, [hydrated, loggedIn, next, router]);

  const free = [
    tx("পার্ট দেখা ও খোঁজা", "Browse and search parts"),
    tx("গাড়ি সেভ করা", "Save your car"),
    tx("পার্ট চাওয়া (শুধু ফোন নম্বর দিয়ে)", "Request a part (phone number only)"),
  ];
  const needs = [tx("অর্ডার করা", "Place orders"), tx("অর্ডার ট্র্যাক করা", "Track orders"), tx("চ্যাট হিস্ট্রি", "Chat history"), tx("রিটার্ন / ওয়ারেন্টি দাবি", "Returns / warranty claims")];

  return (
    <Container className="max-w-md space-y-4">
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent-ink">
            <Lock className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold">{tx("লগইন করুন", "Log in")}</h1>
            <p className="text-sm text-muted">{tx("শুধু ফোন নম্বর লাগবে, পাসওয়ার্ড নেই", "Just your phone number, no password")}</p>
          </div>
        </div>
        <AudioGuide
          className="mb-4"
          text={tx(
            "আপনার মোবাইল নম্বর লিখে 'কোড পাঠান' চাপুন। SMS-এ ৬ সংখ্যার কোড আসবে, সেটা বসিয়ে 'প্রবেশ করুন' চাপুন।",
            "Type your mobile number and tap 'Send code'. Enter the 6-digit code from the SMS and tap 'Verify'.",
          )}
        />
        {hydrated && loggedIn ? (
          <p className="py-6 text-center font-semibold">{tx("লগইন হয়েছে, নিয়ে যাচ্ছি…", "Logged in, taking you back…")}</p>
        ) : (
          <LoginForm />
        )}
      </Card>

      <Card className="grid grid-cols-2 gap-4 p-4 text-sm">
        <div>
          <p className="mb-2 font-semibold">{tx("লগইন ছাড়াই পারবেন", "Without login")}</p>
          <ul className="space-y-1.5">
            {free.map((f) => (
              <li key={f} className="flex gap-1.5">
                <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden /> {f}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 font-semibold">{tx("লগইন লাগবে", "Needs login")}</p>
          <ul className="space-y-1.5">
            {needs.map((f) => (
              <li key={f} className="flex gap-1.5">
                <X className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden /> {f}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </Container>
  );
}
