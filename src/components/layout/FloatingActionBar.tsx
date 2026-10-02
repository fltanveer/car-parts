"use client";

import { Camera, MessageCircle, Mic, Phone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { telLink, waLink } from "@/lib/links";
import { useT } from "../providers/LangProvider";

// Spec 4.5 + 7.1: always-present speak / photo / call / WhatsApp bar.
export function FloatingActionBar() {
  const { t } = useT();
  const path = usePathname();
  // The request wizard and chat have their own recorders; hide to avoid double controls.
  if (path.startsWith("/request") && !path.startsWith("/request/")) return null;
  if (path.startsWith("/chat") || path.startsWith("/checkout")) return null;

  const item = "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-semibold";
  return (
    <nav
      aria-label={t("request_part")}
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-3xl">
        <Link href="/request?mode=voice" className={item}>
          <span className="grid size-9 place-items-center rounded-full bg-danger text-white">
            <Mic className="size-5" aria-hidden />
          </span>
          {t("speak")}
        </Link>
        <Link href="/request?mode=photo" className={item}>
          <span className="grid size-9 place-items-center rounded-full bg-ink text-white">
            <Camera className="size-5" aria-hidden />
          </span>
          {t("photo")}
        </Link>
        <a href={telLink()} className={item}>
          <span className="grid size-9 place-items-center rounded-full bg-q-oem text-white">
            <Phone className="size-5" aria-hidden />
          </span>
          {t("call")}
        </a>
        <a href={waLink("আসসালামু আলাইকুম, আমার একটা পার্ট লাগবে।")} target="_blank" rel="noopener" className={item}>
          <span className="grid size-9 place-items-center rounded-full bg-[#25D366] text-white">
            <MessageCircle className="size-5" aria-hidden />
          </span>
          {t("whatsapp")}
        </a>
      </div>
    </nav>
  );
}
