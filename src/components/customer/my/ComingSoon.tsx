"use client";

import { BellRing, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useDb } from "@/lib/db/store";
import { normalizePhone } from "@/lib/format";
import { locations } from "@/lib/mock/settings";
import { AudioGuide } from "../../layout/AudioGuide";
import { BackButton, HelpCall, toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, Card, Field, Input, Notice, PageHeader, Select } from "../../ui/primitives";
import { registerInterest } from "./customerActions";
import { useMyPhone } from "./common";

/** "Coming soon" + interest sign-up (service + area) so we can measure demand (file 01 §10). */
export function InterestForm({ service, label }: { service: string; label: string }) {
  const { tx } = useT();
  const { phone: known } = useMyPhone();
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("ঢাকা");
  const [area, setArea] = useState("");
  const done = useDb((s) => !!known && s.serviceInterest.some((x) => x.service === service && x.phone === known));
  const districts = locations.flatMap((l) => l.districts);
  const areas = districts.find((x) => x.name === district)?.areas ?? [];
  const p = known ?? normalizePhone(phone);

  if (done)
    return (
      <Notice tone="ok">
        <CheckCircle2 className="mr-1 inline size-5" aria-hidden /> {tx(`"${label}" এ আপনার আগ্রহ নেওয়া হয়েছে। চালু হলেই SMS দেবো।`, `We've noted your interest in "${label}". We'll SMS you when it launches.`)}
      </Notice>
    );

  return (
    <Card className="space-y-3 p-4">
      <p className="text-lg font-bold">🔔 {tx("চালু হলে জানাবো", "Tell me when it launches")}</p>
      {!known && (
        <Field label={tx("📱 মোবাইল নম্বর", "📱 Mobile number")}>
          <Input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label={tx("জেলা", "District")}>
          <Select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setArea("");
            }}
          >
            {districts.map((x) => (
              <option key={x.name}>{x.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={tx("এলাকা", "Area")}>
          <Select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">{tx("বাছুন", "Choose")}</option>
            {areas.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Button
        variant="brand"
        size="lg"
        full
        disabled={!p || !area}
        onClick={() => {
          registerInterest(service, `${area}, ${district}`, p!);
          toast(tx("ধন্যবাদ! চালু হলে জানাবো", "Thanks! We'll let you know"));
        }}
      >
        <BellRing className="size-5" aria-hidden /> {tx("আগ্রহ জানান", "Register interest")}
      </Button>
    </Card>
  );
}

/** Shared shell for phase-2/3 pages. */
export function ComingSoon({
  icon, title, body, service, back = "/", children, guide,
}: {
  icon: string;
  title: string;
  body: string;
  service: string;
  back?: string;
  children?: ReactNode;
  guide?: string;
}) {
  const { tx } = useT();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4">
      <PageHeader back={<BackButton href={back} />} title={`${icon} ${title}`}>
        <span className="shrink-0 rounded-full bg-wait-soft px-3 py-1 text-sm font-bold text-wait">{tx("শীঘ্রই আসছে", "Coming soon")}</span>
      </PageHeader>
      <AudioGuide text={guide ?? `${title}। ${body} ${tx("চালু হলে জানতে নিচে আগ্রহ জানান।", "Register below to hear when it launches.")}`} />
      <p className="text-lg">{body}</p>
      <InterestForm service={service} label={title} />
      {children}
      <HelpCall />
    </div>
  );
}
