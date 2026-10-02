"use client";

import clsx from "clsx";
import { Phone } from "lucide-react";
import type { CallTime, PreferredContact } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { Input } from "../ui/primitives";
import { callTimeOptions, contactOptions } from "./labels";

const optionClass = (on: boolean) =>
  clsx(
    "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 bg-card px-2 py-2 text-center font-semibold transition-colors",
    on ? "border-ink bg-ink text-white" : "border-line hover:border-ink/30",
  );

export function StepContact({
  phone,
  onPhone,
  phoneError,
  loggedIn,
  name,
  onName,
  contact,
  onContact,
  callTime,
  onCallTime,
}: {
  phone: string;
  onPhone: (p: string) => void;
  phoneError: string | null;
  loggedIn: boolean;
  name: string;
  onName: (n: string) => void;
  contact: PreferredContact;
  onContact: (c: PreferredContact) => void;
  callTime: CallTime;
  onCallTime: (c: CallTime) => void;
}) {
  const { tx, lang } = useT();

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="req-phone" className="mb-1.5 block text-lg font-bold">
          {tx("আপনার মোবাইল নম্বর", "Your mobile number")}
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <Input
            id="req-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01XXX-XXXXXX"
            value={phone}
            onChange={(e) => onPhone(e.target.value)}
            aria-invalid={!!phoneError}
            className={clsx("min-h-14 pl-12 text-2xl tracking-wide", phoneError && "border-danger")}
          />
        </div>
        {phoneError ? (
          <p className="mt-1 text-sm font-medium text-danger" role="alert">
            {phoneError}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">
            {loggedIn
              ? tx("আপনার অ্যাকাউন্টের নম্বর বসানো আছে", "Filled from your account")
              : tx("লগইন লাগবে না। এই নম্বরে ফোন করে দাম জানাবো।", "No login needed. We'll call this number with the price.")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="req-name" className="mb-1.5 block font-semibold">
          {tx("আপনার নাম", "Your name")} <span className="font-normal text-muted">({tx("ঐচ্ছিক", "optional")})</span>
        </label>
        <Input id="req-name" autoComplete="name" value={name} onChange={(e) => onName(e.target.value)} />
      </div>

      <fieldset>
        <legend className="mb-2 font-semibold">{tx("কীভাবে যোগাযোগ করবো?", "How should we contact you?")}</legend>
        <div className="grid grid-cols-3 gap-2">
          {contactOptions.map((o) => (
            <button key={o.key} type="button" aria-pressed={contact === o.key} onClick={() => onContact(o.key)} className={optionClass(contact === o.key)}>
              <span className="text-2xl" aria-hidden>
                {o.icon}
              </span>
              <span className="text-sm">{o[lang]}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-semibold">{tx("কখন ফোন করলে সুবিধা?", "When is a good time to call?")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {callTimeOptions.map((o) => (
            <button key={o.key} type="button" aria-pressed={callTime === o.key} onClick={() => onCallTime(o.key)} className={optionClass(callTime === o.key)}>
              <span className="text-2xl" aria-hidden>
                {o.icon}
              </span>
              <span>{o[lang]}</span>
              <span className={clsx("text-xs font-normal", callTime === o.key ? "text-white/75" : "text-muted")}>{lang === "bn" ? o.sub_bn : o.sub_en}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
