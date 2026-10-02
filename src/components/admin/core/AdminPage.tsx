"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { BackButton, HelpCall } from "@/components/shared/Misc";

/**
 * Standard admin screen frame: title, 🔊 instructions (rule 5), optional back
 * (rule 9), actions on the right, help call at the bottom (rule 7).
 */
export function AdminPage({
  title, subtitle, guide, actions, back, children, narrow, className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  guide?: string;
  actions?: ReactNode;
  back?: string | true;
  children: ReactNode;
  narrow?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto w-full", narrow ? "max-w-3xl" : "max-w-7xl", className)}>
      {back && <BackButton href={back === true ? undefined : back} />}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {guide && <AudioGuide text={guide} className="mb-4" />}
      <div className="space-y-5">{children}</div>
      <HelpCall className="mt-8 max-w-md" />
    </div>
  );
}
