"use client";

import { Clock } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "@/components/providers/LangProvider";

/** Clear "Phase 2/3 — coming soon" banner for planned modules. */
export function PhaseNotice({ phase = 2, children }: { phase?: 2 | 3 | "2/3"; children?: ReactNode }) {
  const { tx, d } = useT();
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-wait-bg/60 bg-wait-soft p-4 text-wait">
      <Clock className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <p className="font-bold">
          {tx(`ফেজ ${d(String(phase))} · শীঘ্রই আসছে`, `Phase ${phase} · coming soon`)}
        </p>
        <p className="text-sm">{children ?? tx("এই মডিউল এখনো চালু হয়নি। নিচে পরিকল্পিত কাজের তালিকা ও নমুনা দেখানো হলো।", "This module isn't live yet. The planned queues and a preview are shown below.")}</p>
      </div>
    </div>
  );
}
