"use client";

import { Phone, RotateCw } from "lucide-react";
import { telLink } from "@/lib/links";
import { settings } from "@/lib/mock/settings";
import { Button, buttonClass } from "../ui/primitives";

export function OfflineActions() {
  return (
    <div className="space-y-2">
      <Button variant="primary" size="lg" full onClick={() => window.location.reload()}>
        <RotateCw className="size-5" aria-hidden /> আবার চেষ্টা করুন · Retry
      </Button>
      <a href={telLink()} className={buttonClass("outline", "lg", true)}>
        <Phone className="size-5" aria-hidden /> কল করুন {settings.hotline_display}
      </a>
    </div>
  );
}
