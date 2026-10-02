"use client";

import { Briefcase, Truck, UserRound, Wrench, X } from "lucide-react";
import { useState } from "react";
import { displayPhone } from "@/lib/format";
import { getState, updateProfile } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { LoginForm } from "../auth/LoginForm";
import { useT } from "../providers/LangProvider";
import { Button, Card, ChoiceCard, Field, Input, SectionTitle } from "../ui/primitives";

const TYPES: { id: Profile["account_type"]; bn: string; en: string; sub_bn: string; sub_en: string; Icon: typeof Wrench }[] = [
  { id: "personal", bn: "ব্যক্তিগত", en: "Personal", sub_bn: "নিজের গাড়ির জন্য", sub_en: "For my own car", Icon: UserRound },
  { id: "mechanic", bn: "মেকানিক / গ্যারেজ", en: "Mechanic / garage", sub_bn: "কাস্টমারের গাড়ির জন্য কিনি", sub_en: "I buy for customers' cars", Icon: Wrench },
  { id: "fleet", bn: "ফ্লিট", en: "Fleet", sub_bn: "অনেকগুলো গাড়ি চালাই", sub_en: "I run several vehicles", Icon: Truck },
];

export function ProfileCard({ profile }: { profile: Profile }) {
  const { tx, d } = useT();
  const [name, setName] = useState(profile.full_name ?? "");
  const [saved, setSaved] = useState(false);
  const [changingPhone, setChangingPhone] = useState(false);

  const dirty = name.trim() !== (profile.full_name ?? "");

  return (
    <section className="space-y-4">
      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ink text-xl font-bold text-accent">
            {(profile.full_name?.trim()[0] ?? "").toUpperCase() || <UserRound className="size-6" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{profile.full_name || tx("নাম দেওয়া হয়নি", "No name yet")}</p>
            <p className="text-muted">{d(displayPhone(profile.phone))}</p>
          </div>
        </div>

        <Field label={tx("আপনার নাম", "Your name")}>
          <div className="flex gap-2">
            <Input
              value={name}
              autoComplete="name"
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              placeholder={tx("যেমন: রাকিব হাসান", "e.g. Rakib Hasan")}
            />
            <Button
              variant="primary"
              disabled={!dirty}
              onClick={() => {
                updateProfile({ full_name: name.trim() || null });
                setSaved(true);
              }}
            >
              {tx("সেভ", "Save")}
            </Button>
          </div>
        </Field>
        {saved && <p className="text-sm font-semibold text-ok">{tx("নাম সেভ হয়েছে ✓", "Name saved ✓")}</p>}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="font-semibold">{tx("মোবাইল নম্বর", "Mobile number")}</p>
            <p className="text-muted">{d(displayPhone(profile.phone))}</p>
          </div>
          {!changingPhone && (
            <Button variant="outline" size="sm" onClick={() => setChangingPhone(true)}>
              {tx("নম্বর বদলান", "Change number")}
            </Button>
          )}
        </div>
        {changingPhone && (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-sm text-ink-2">
                {tx("নতুন নম্বরে একটা কোড যাবে। কোড দিলে নম্বর বদলে যাবে।", "We'll send a code to the new number. Enter it to switch.")}
              </p>
              <button type="button" aria-label={tx("বন্ধ", "Close")} onClick={() => setChangingPhone(false)} className="-m-1 p-1">
                <X className="size-5" />
              </button>
            </div>
            <LoginForm
              onDone={() => {
                // login() starts a fresh profile for a new number; keep name and type.
                const cur = getState().profile;
                if (cur && cur.phone !== profile.phone) updateProfile({ full_name: profile.full_name, account_type: profile.account_type });
                setChangingPhone(false);
              }}
            />
          </div>
        )}
      </Card>

      <div>
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <Briefcase className="size-5" aria-hidden /> {tx("অ্যাকাউন্টের ধরন", "Account type")}
          </span>
        </SectionTitle>
        <div className="space-y-2">
          {TYPES.map((ty) => (
            <ChoiceCard
              key={ty.id}
              selected={profile.account_type === ty.id}
              onClick={() => updateProfile({ account_type: ty.id })}
              icon={<ty.Icon className="size-5" />}
              title={tx(ty.bn, ty.en)}
              subtitle={tx(ty.sub_bn, ty.sub_en)}
            />
          ))}
        </div>
        {profile.account_type !== "personal" && (
          <p className="mt-2 text-sm text-muted">
            {tx("গ্যারেজ ও ফ্লিটের জন্য বিশেষ দাম শিগগিরই আসছে।", "Special pricing for garages and fleets is coming soon.")}
          </p>
        )}
      </div>
    </section>
  );
}
