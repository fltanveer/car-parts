"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { useT } from "../providers/LangProvider";

// Bottom sheet on phones, centred dialog on wider screens.
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  const { tx } = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label={tx("বন্ধ", "Close")} className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="sheet-up relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-card px-5 py-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label={tx("বন্ধ", "Close")} className="grid size-11 place-items-center rounded-full hover:bg-ink/5">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-5 pt-4">{children}</div>
      </div>
    </div>
  );
}
