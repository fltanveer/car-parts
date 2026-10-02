"use client";

import { Home, Mic } from "lucide-react";
import { HelpCall } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { ButtonLink, Container } from "@/components/ui/primitives";

/** App-wide 404: friendly, never a dead end (rule 9). */
export default function NotFound() {
  const { tx } = useT();
  return (
    <Container className="max-w-md space-y-5 py-10 text-center">
      <p className="text-6xl" aria-hidden>
        🧭
      </p>
      <h1 className="text-2xl font-bold">{tx("এই পাতাটা পাওয়া যায়নি", "We couldn't find this page")}</h1>
      <p className="text-muted">{tx("লিংকটা হয়তো পুরনো। চিন্তা নেই, নিচের বাটন থেকে শুরু করুন।", "The link may be old. No worries, start from a button below.")}</p>
      <ButtonLink href="/" variant="primary" size="lg" full>
        <Home className="size-5" aria-hidden /> {tx("হোমে যান", "Go home")}
      </ButtonLink>
      <ButtonLink href="/request?mode=voice" variant="outline" size="lg" full>
        <Mic className="size-5 text-bad" aria-hidden /> {tx("পার্ট চাই: বলে দিন", "Request a part by voice")}
      </ButtonLink>
      <HelpCall />
    </Container>
  );
}
