"use client";

import { usePathname, useRouter } from "next/navigation";
import { openThread } from "@/lib/db/actions";
import { getDb } from "@/lib/db/store";
import type { ChatThread } from "@/lib/types";

/** 💬 ask a shop: needs login (rule 8: asked only now), then opens the chat thread. */
export function useAskShop() {
  const router = useRouter();
  const path = usePathname();
  return (vendorId: string, contextType: ChatThread["context_type"] = null, contextId: string | null = null) => {
    if (!getDb().session.customerPhone) {
      router.push(`/login?next=${encodeURIComponent(path)}`);
      return;
    }
    const id = openThread({ type: "customer_vendor", vendorId, contextType, contextId });
    router.push(`/messages/${id}`);
  };
}

/** Send to login when an action needs an account; returns true when already logged in. */
export function useRequireLogin() {
  const router = useRouter();
  const path = usePathname();
  return () => {
    if (getDb().session.customerPhone) return true;
    router.push(`/login?next=${encodeURIComponent(path)}`);
    return false;
  };
}
