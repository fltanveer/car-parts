"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { SpeakButton } from "../../layout/AudioGuide";
import { BackButton, HelpCall } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Card, Container, PageHeader } from "../../ui/primitives";
import { buildPolicies } from "./policies";

/** /policy and /policy/[slug]: Bangla policies, every one with 🔊 (file 00 §5). */
export function PolicyView({ slug }: { slug: string | null }) {
  const { tx, d, L } = useT();
  const policies = buildPolicies(d);
  const p = policies.find((x) => x.slug === slug);

  if (!p)
    return (
      <Container className="space-y-4">
        <PageHeader back={<BackButton href="/help" />} title={`📜 ${tx("নিয়ম ও নীতি", "Policies")}`} subtitle={tx("সব নিয়ম বাংলায়, শুনেও নিতে পারেন", "All rules in plain language, with audio")} />
        <Card className="divide-y divide-line overflow-hidden">
          {policies.map((x) => (
            <Link key={x.slug} href={`/policy/${x.slug}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-surface">
              <span className="text-2xl" aria-hidden>
                {x.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{L(x.title)}</span>
                <span className="block text-sm text-muted">{L(x.summary)}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
            </Link>
          ))}
        </Card>
        <HelpCall />
      </Container>
    );

  const all = [L(p.title), L(p.summary), ...p.sections.flatMap((s) => [L(s.h), ...s.items.map(L)])].join("। ");
  return (
    <Container className="space-y-5">
      <PageHeader back={<BackButton href="/policy" label={tx("সব নীতি", "All policies")} />} title={`${p.icon} ${L(p.title)}`} subtitle={L(p.summary)} />
      <SpeakButton text={all} label={tx("পুরোটা শুনুন", "Listen to all")} className="min-h-12" />
      {p.sections.map((s, i) => (
        <section key={i} className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{L(s.h)}</h2>
            <SpeakButton text={[L(s.h), ...s.items.map(L)].join("। ")} />
          </div>
          <ul className="space-y-2">
            {s.items.map((it, j) => (
              <li key={j} className="rounded-xl border border-line bg-card p-3">
                {L(it)}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-sm text-muted">{tx("ডিজিটাল কমার্স পরিচালনা নির্দেশিকা ২০২১ অনুযায়ী। প্রশ্ন থাকলে কল করুন।", "Per the Digital Commerce Guidelines 2021. Call us with any questions.")}</p>
      <HelpCall />
    </Container>
  );
}
