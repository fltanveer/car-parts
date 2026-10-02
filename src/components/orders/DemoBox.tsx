"use client";

import type { ReactNode } from "react";
import { useT } from "../providers/LangProvider";
import { Notice } from "../ui/primitives";

// Clearly-labelled wrapper for demo-only controls that stand in for what the
// admin panel will do (verify payment, move order status, ...).
export function DemoBox({ children, note }: { children: ReactNode; note?: string }) {
  const { tx } = useT();
  return (
    <Notice className="no-print mt-4 border-dashed">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">🧪 {tx("শুধু ডেমোর জন্য", "Demo only")}</p>
      <p className="mb-2 text-xs text-muted">{note ?? tx("আসল সাইটে এটা অ্যাডমিন করবে।", "On the real site the admin does this.")}</p>
      {children}
    </Notice>
  );
}
