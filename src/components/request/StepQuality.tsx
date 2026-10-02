"use client";

import clsx from "clsx";
import { Check, Sparkles } from "lucide-react";
import { qualityLabel } from "@/lib/i18n";
import type { ReactNode } from "react";
import type { Quality } from "@/lib/types";
import { qualityDot } from "../part/QualityBadge";
import { useT } from "../providers/LangProvider";

const QUALITIES: Quality[] = ["genuine", "oem_equivalent", "aftermarket", "reconditioned"];

function Option({
  selected,
  onClick,
  icon,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        "flex min-h-16 w-full items-start gap-3 rounded-2xl border-2 bg-card p-4 text-left transition-colors",
        selected ? "border-ink bg-ink/[0.03]" : "border-line hover:border-ink/30",
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold">{title}</span>
        <span className="block text-sm text-muted">{desc}</span>
      </span>
      <span
        className={clsx(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border-2",
          selected ? "border-ink bg-ink text-white" : "border-line",
        )}
        aria-hidden
      >
        {selected && <Check className="size-4" strokeWidth={3} />}
      </span>
    </button>
  );
}

export function StepQuality({ value, onChange }: { value: Quality[]; onChange: (q: Quality[]) => void }) {
  const { tx, lang } = useT();
  const toggle = (q: Quality) => onChange(value.includes(q) ? value.filter((x) => x !== q) : [...value, q]);

  return (
    <div className="space-y-2.5">
      <Option
        selected={value.length === 0}
        onClick={() => onChange([])}
        icon={
          <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent-ink">
            <Sparkles className="size-5" />
          </span>
        }
        title={tx("আপনারা সাজেস্ট করুন", "You suggest")}
        desc={tx("না বুঝলে এটাই রাখুন। আমরা একাধিক মানের দাম জানাবো।", "Not sure? Keep this. We'll quote a few quality options.")}
      />
      <p className="px-1 pt-2 text-sm font-semibold text-muted">{tx("অথবা নির্দিষ্ট মান (একাধিক বেছে নিতে পারেন):", "Or specific qualities (pick any):")}</p>
      {QUALITIES.map((q) => (
        <Option
          key={q}
          selected={value.includes(q)}
          onClick={() => toggle(q)}
          icon={<span className={clsx("mx-2 my-2.5 block size-5 rounded-full", qualityDot[q])} />}
          title={qualityLabel[q][lang]}
          desc={lang === "bn" ? qualityLabel[q].desc_bn : qualityLabel[q].desc_en}
        />
      ))}
    </div>
  );
}
