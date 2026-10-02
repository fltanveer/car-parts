"use client";

import { MessageCircle, MessagesSquare, Phone } from "lucide-react";
import Link from "next/link";
import { settings } from "@/lib/api";
import { telLink, waLink } from "@/lib/links";
import { useT } from "../providers/LangProvider";
import { buttonClass } from "../ui/primitives";

// "Talk to us" row: chat, call, WhatsApp. Used where rules say no but a
// human might still help (claims), and on screens without the floating bar.
export function ContactUs({ message, title }: { message?: string; title?: string }) {
  const { tx } = useT();
  const btn = `${buttonClass("outline", "md", true)} min-h-16 flex-col !gap-0.5 px-1 text-sm`;
  return (
    <div className="no-print rounded-2xl border border-line bg-card p-4">
      <p className="mb-3 font-semibold">{title ?? tx("আমাদের সাথে কথা বলুন", "Talk to us")}</p>
      <div className="grid grid-cols-3 gap-2">
        <Link href="/chat" className={btn}>
          <MessagesSquare className="size-5" aria-hidden /> <span>{tx("চ্যাট", "Chat")}</span>
        </Link>
        <a href={telLink()} className={btn}>
          <Phone className="size-5" aria-hidden /> <span>{tx("কল", "Call")}</span>
        </a>
        <a href={waLink(message)} target="_blank" rel="noopener" className={btn}>
          <MessageCircle className="size-5" aria-hidden /> <span>WhatsApp</span>
        </a>
      </div>
      <p className="mt-2 text-center text-sm text-muted">
        {tx("হটলাইন", "Hotline")}: <a href={telLink()} className="font-semibold text-ink">{settings.hotline_display}</a>
      </p>
    </div>
  );
}
