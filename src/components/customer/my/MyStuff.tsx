"use client";

import clsx from "clsx";
import { ChevronRight, Mic } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useDb, useHydrated } from "@/lib/db/store";
import { AudioGuide } from "../../layout/AudioGuide";
import { HelpCall } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { ButtonLink, Card, Container, EmptyState, PageHeader, StatusPill, Tabs } from "../../ui/primitives";
import { LoginNeeded, TypeIcon, useMyPhone } from "./common";
import { buildMyItems, type Bucket, type MyItem } from "./myItems";

/** /my: one list for orders, requests and claims (file 01 §7). */
export function MyStuff() {
  const { tx, d } = useT();
  const hydrated = useHydrated();
  const { phone, loggedIn } = useMyPhone();
  const db = useDb((s) => s);
  const [tab, setTab] = useState<Bucket>("ongoing");
  const items = useMemo(() => buildMyItems(db, phone, loggedIn, d), [db, phone, loggedIn, d]);
  if (!hydrated) return <Container className="h-96 animate-pulse" />;

  const count = (b: Bucket) => items.filter((i) => i.bucket === b).length;
  const list = items.filter((i) => i.bucket === tab);

  return (
    <Container className="space-y-4">
      <PageHeader title={`📦 ${tx("আমার কাজ", "My stuff")}`} subtitle={tx("অর্ডার, রিকোয়েস্ট, সমস্যা: সব এক জায়গায়", "Orders, requests and problems in one place")} />
      <AudioGuide text={tx("এখানে আপনার সব অর্ডার আর রিকোয়েস্ট আছে। সবুজ বাটন মানে এখন আপনার কিছু করার আছে।", "All your orders and requests are here. A green button means there is something for you to do now.")} />

      {!loggedIn && <LoginNeeded next="/my" why={phone ? tx("আপনার রিকোয়েস্ট নিচে আছে। অর্ডার দেখতে লগইন করুন।", "Your requests are below. Log in to see orders.") : undefined} />}

      {(phone || loggedIn) && (
        <>
          <Tabs<Bucket>
            value={tab}
            onChange={setTab}
            items={[
              { value: "ongoing", label: `⏳ ${tx("চলমান", "Ongoing")}`, count: count("ongoing") },
              { value: "finished", label: `✅ ${tx("শেষ", "Finished")}` },
              { value: "cancelled", label: `✖️ ${tx("বাতিল", "Cancelled")}` },
            ]}
          />
          {list.length === 0 ? (
            <EmptyState
              icon="📭"
              title={tab === "ongoing" ? tx("এখন কিছু চলছে না", "Nothing in progress") : tx("এখানে কিছু নেই", "Nothing here")}
              body={tx("কোনো পার্ট লাগলে বলুন, দোকানগুলো দাম দেবে।", "Need a part? Tell us and shops will quote.")}
              action={
                <ButtonLink href="/request?mode=voice" variant="brand" size="lg">
                  <Mic className="size-5" aria-hidden /> {tx("পার্ট চাই", "Request a part")}
                </ButtonLink>
              }
            />
          ) : (
            <ul className="space-y-3">
              {list.map((i) => (
                <li key={i.key}>
                  <ItemCard item={i} />
                </li>
              ))}
            </ul>
          )}
          <p className="text-center text-sm text-muted">🧰 {tx("মেকানিক বুকিং ও 🚙 গাড়ির বিজ্ঞাপন শীঘ্রই এখানে দেখা যাবে", "Mechanic bookings and 🚙 car ads will show here soon")}</p>
        </>
      )}
      <HelpCall />
    </Container>
  );
}

function ItemCard({ item }: { item: MyItem }) {
    const { L, ago } = useT();
    const btnTone = { ok: "bg-ok text-white", bad: "bg-bad text-white", wait: "bg-wait-bg text-ink", info: "bg-ink text-white" };
    return (
      <Card className="overflow-hidden">
        <Link href={item.href} className="flex items-center gap-3 p-4 hover:bg-surface/60">
          <TypeIcon icon={item.icon} tone={item.state.tone} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{L(item.title)}</span>
            <span className="block truncate text-sm text-muted">
              {item.sub} · {ago(item.at)}
            </span>
            <StatusPill tone={item.state.tone} className="mt-1">
              {L(item.state)}
            </StatusPill>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
        </Link>
        {item.action && (
          <Link href={item.action.href} className={clsx("flex min-h-12 items-center justify-center gap-2 px-4 font-bold", btnTone[item.action.tone])}>
            {L(item.action)} →
          </Link>
        )}
      </Card>
    );
}
