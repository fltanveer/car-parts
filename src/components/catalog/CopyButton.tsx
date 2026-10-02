"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "../providers/LangProvider";

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Older Android WebViews: fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } finally {
        ta.remove();
      }
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ? `${t("copy")}: ${label}` : t("copy")}
      className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line bg-card px-2.5 text-sm font-semibold hover:border-ink/40"
    >
      {copied ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
    </button>
  );
}
