"use client";

import Link from "next/link";
import { useState } from "react";
import { publishStatus, saveSellerListing } from "@/lib/db/actions-seller";
import type { Listing, Vendor } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { toast } from "../../shared/Misc";
import { Sheet } from "../../ui/Sheet";
import { Button, Notice } from "../../ui/primitives";
import { ListingMini } from "../Bits";

/** WhatsApp / field-agent drafts made by the team → approve (file 02 §5.4). */
export function DraftsCard({ vendor, drafts }: { vendor: Vendor; drafts: Listing[] }) {
  const { tx, d } = useT();
  const [open, setOpen] = useState(false);
  if (!drafts.length) return null;
  const approve = (l: Listing) => {
    const ps = publishStatus(vendor, l.category_id);
    if (ps.status === "draft") {
      toast(ps.reason === "level0" ? tx("আগে পরিচয় যাচাই করুন, তারপর পোস্ট হবে", "Verify your identity first") : tx("২০টার সীমা শেষ, দোকান যাচাই করুন", "Limit of 20 reached, verify your shop"), "bad");
      return;
    }
    saveSellerListing({ ...l, status: ps.status }, `ড্রাফট অনুমোদন: ${l.title_bn}`);
    toast(ps.status === "active" ? tx("পোস্ট হয়েছে", "Posted") : tx("অনুমোদনের জন্য পাঠানো হয়েছে", "Sent for review"));
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex min-h-20 w-full items-center gap-3 rounded-2xl border-2 border-brand/40 bg-brand-soft/40 p-4 text-left">
        <span className="text-3xl">🧾</span>
        <span className="flex-1">
          <span className="block text-lg font-bold">{tx(`টিম ${d(drafts.length)}টা পণ্য বানিয়ে দিয়েছে`, `Team made ${drafts.length} products for you`)}</span>
          <span className="block text-sm text-ink-2">{tx("দেখে অনুমোদন দিন", "Check and approve")}</span>
        </span>
        <span className="text-2xl">›</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={tx("ড্রাফট পণ্য", "Draft products")}>
        <div className="space-y-3 pb-2">
          {vendor.verification_level === 0 && <Notice tone="wait">{tx("পোস্ট করতে আগে NID যাচাই করুন।", "Verify NID before posting.")}</Notice>}
          {drafts.map((l) => (
            <div key={l.id} className="space-y-2 rounded-2xl border border-line p-2">
              <ListingMini listing={l} />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ok" size="lg" onClick={() => approve(l)} disabled={l.price <= 0}>
                  ✅ {tx("ঠিক আছে, পোস্ট", "OK, post")}
                </Button>
                <Link href={`/seller/products/${l.id}`} className="grid min-h-14 place-items-center rounded-2xl border-2 border-line font-semibold">
                  ✏️ {tx("সংশোধন", "Edit")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </>
  );
}
