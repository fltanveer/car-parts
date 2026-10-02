"use client";

import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { partFits } from "@/lib/api";
import { useActiveVehicle } from "@/lib/store";
import type { Part } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { PartImage } from "./PartImage";
import { QualityBadge } from "./QualityBadge";

export function AvailabilityLine({ part }: { part: Part }) {
  const { t, range, tx } = useT();
  if (part.availability === "in_stock")
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-ok">
        <span className="size-2 rounded-full bg-ok" aria-hidden />
        {t("in_stock")} <span className="font-normal text-muted">· {range(1, 2)} {t("days")}</span>
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium text-accent-ink">
      <span className="size-2 rounded-full bg-accent" aria-hidden />
      {t("sourcing")}{" "}
      <span className="font-normal text-muted">
        · {range(part.sourcing_days_min, part.sourcing_days_max)} {tx("দিন", "days")}
      </span>
    </span>
  );
}

export function PartCard({ part }: { part: Part }) {
  const { lang, t, taka } = useT();
  const vehicle = useActiveVehicle();
  const fits = partFits(part, vehicle?.generation_id ?? null);

  return (
    <Link
      href={`/part/${part.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-shadow hover:shadow-[0_2px_12px_rgb(0_0_0/0.06)]"
    >
      <PartImage part={part} />
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <QualityBadge quality={part.quality} lang={lang} />
          {part.warranty_months > 0 && (
            <ShieldCheck className="size-4.5 text-q-genuine" aria-label={t("warranty")} />
          )}
        </div>
        <h3 className="line-clamp-2 font-semibold leading-snug">{lang === "bn" ? part.name_bn : part.name}</h3>
        <p className="text-xs text-muted">
          {part.brand} · {lang === "bn" ? part.name : part.name_bn}
        </p>
        <div className="mt-auto pt-1">
          {part.price != null ? (
            <p className="flex items-baseline gap-2">
              <span className="text-lg font-bold">{taka(part.price)}</span>
              {part.compare_at_price && <s className="text-sm text-muted">{taka(part.compare_at_price)}</s>}
            </p>
          ) : (
            <p className="text-sm font-semibold text-accent-ink">{t("ask_price")}</p>
          )}
          <AvailabilityLine part={part} />
          {fits === true && (
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-ok">
              <CheckCircle2 className="size-4" aria-hidden /> {t("fits_your_car")}
            </p>
          )}
          {fits === false && (
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-q-after">
              <AlertTriangle className="size-4" aria-hidden /> {t("not_fit_your_car")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function PartGrid({ parts }: { parts: Part[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {parts.map((p) => (
        <PartCard key={p.id} part={p} />
      ))}
    </div>
  );
}
