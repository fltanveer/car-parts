"use client";

import { ArrowRight, Check, Copy, MessageSquareText } from "lucide-react";
import { useState } from "react";
import { displayPhone } from "@/lib/format";
import type { PartRequest } from "@/lib/types";
import { AudioGuide } from "../layout/AudioGuide";
import { useT } from "../providers/LangProvider";
import { ButtonLink, Card, Container } from "../ui/primitives";
import { replyPromise } from "./labels";

// Spec 7.8 step 5: confirmation with a big, easy-to-read request number.
export function RequestSent({ request, phone }: { request: PartRequest; phone: string }) {
  const { tx, d, lang } = useT();
  const [copied, setCopied] = useState(false);
  const promise = replyPromise(lang);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(request.request_no);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; number is on screen */
    }
  };

  return (
    <Container className="max-w-xl">
      <Card className="space-y-5 p-6 text-center">
        <div className="mx-auto grid size-24 place-items-center rounded-full bg-ok text-white shadow-lg">
          <Check className="size-14" strokeWidth={3} aria-hidden />
        </div>
        <h1 className="text-2xl font-bold">{tx("আপনার রিকোয়েস্ট পেয়েছি", "We got your request")}</h1>

        <div className="rounded-2xl bg-surface p-4">
          <p className="text-sm font-semibold text-muted">{tx("রিকোয়েস্ট নম্বর", "Request number")}</p>
          <p className="my-1 font-mono text-5xl font-bold tracking-wider" aria-label={request.request_no.split("").join(" ")}>
            {d(request.request_no)}
          </p>
          <button type="button" onClick={() => void copy()} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:bg-ink/5">
            {copied ? <Check className="size-4 text-ok" /> : <Copy className="size-4" />}
            {copied ? tx("কপি হয়েছে", "Copied") : tx("নম্বর কপি করুন", "Copy number")}
          </button>
          <p className="text-sm text-muted">{tx("ফোনে কথা বলার সময় এই নম্বর বলুন", "Mention this number when you call us")}</p>
        </div>

        <p className="text-lg font-medium">{promise}</p>
        <AudioGuide className="flex flex-col items-center" text={`${tx("আপনার রিকোয়েস্ট পেয়েছি।", "We got your request.")} ${promise}`} label={tx("শুনুন", "Listen")} />

        <p className="flex items-center justify-center gap-2 rounded-xl bg-q-genuine-soft px-4 py-3 text-sm font-medium text-q-genuine">
          <MessageSquareText className="size-5 shrink-0" aria-hidden />
          {tx(`${d(displayPhone(phone))} নম্বরে SMS পাঠানো হয়েছে`, `SMS sent to ${displayPhone(phone)}`)}
        </p>

        <div className="grid gap-2">
          <ButtonLink href={`/request/${request.id}`} variant="primary" size="lg" full>
            {tx("রিকোয়েস্টের অবস্থা দেখুন", "Track this request")} <ArrowRight className="size-5" />
          </ButtonLink>
          <ButtonLink href="/" variant="ghost" full>
            {tx("হোমে ফিরে যান", "Back to home")}
          </ButtonLink>
        </div>
      </Card>
    </Container>
  );
}
