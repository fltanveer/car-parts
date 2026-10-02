"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { AudioGuide } from "../layout/AudioGuide";
import { BackButton, HelpCall } from "../shared/Misc";
import { Container } from "../ui/primitives";

/**
 * Standard seller screen: big back, title, 🔊 instructions, content and the
 * "call for help" bar at the bottom (rules 5, 7, 9).
 */
export function SellerPage({
  title, subtitle, guide, back, action, children, className, noHelp,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  guide?: string;
  back?: string | true;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noHelp?: boolean;
}) {
  return (
    <Container className={clsx("space-y-5", className)}>
      <div>
        {back && <BackButton href={back === true ? undefined : back} />}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
        {guide && <AudioGuide text={guide} className="mt-3" />}
      </div>
      {children}
      {!noHelp && <HelpCall className="no-print" />}
    </Container>
  );
}
