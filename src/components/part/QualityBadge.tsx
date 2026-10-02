import clsx from "clsx";
import { BadgeCheck, CircleDashed, Recycle, ShieldHalf } from "lucide-react";
import { qualityLabel } from "@/lib/i18n";
import type { Lang, Quality } from "@/lib/types";

const STYLE: Record<Quality, { cls: string; Icon: typeof BadgeCheck }> = {
  genuine: { cls: "bg-q-genuine-soft text-q-genuine border-q-genuine/30", Icon: BadgeCheck },
  oem_equivalent: { cls: "bg-q-oem-soft text-q-oem border-q-oem/30", Icon: ShieldHalf },
  aftermarket: { cls: "bg-q-after-soft text-q-after border-q-after/30", Icon: CircleDashed },
  reconditioned: { cls: "bg-q-recon-soft text-q-recon border-q-recon/30", Icon: Recycle },
};

export const qualityDot: Record<Quality, string> = {
  genuine: "bg-q-genuine",
  oem_equivalent: "bg-q-oem",
  aftermarket: "bg-q-after",
  reconditioned: "bg-q-recon",
};

export function QualityBadge({ quality, lang, size = "sm" }: { quality: Quality; lang: Lang; size?: "sm" | "lg" }) {
  const { cls, Icon } = STYLE[quality];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        size === "lg" ? "px-3 py-1 text-base" : "px-2 py-0.5 text-xs",
        cls,
      )}
    >
      <Icon className={size === "lg" ? "size-4.5" : "size-3.5"} aria-hidden />
      {qualityLabel[quality][lang]}
    </span>
  );
}
