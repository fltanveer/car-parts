"use client";

import { Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { displayPhone } from "@/lib/format";
import type { CallTime, MediaItem, PreferredContact, Quality, VoiceNote } from "@/lib/types";
import { MediaThumb } from "../media/PhotoUploader";
import { VoicePlayer } from "../media/VoicePlayer";
import { QualityBadge } from "../part/QualityBadge";
import { useT } from "../providers/LangProvider";
import { Card } from "../ui/primitives";
import { callTimeLabel, contactLabel } from "./labels";

function Section({ emoji, title, onEdit, children }: { emoji: string; title: string; onEdit: () => void; children: ReactNode }) {
  const { tx } = useT();
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold">
          <span aria-hidden>{emoji}</span> {title}
        </h2>
        <button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-q-oem hover:bg-q-oem/5">
          <Pencil className="size-4" aria-hidden /> {tx("বদলান", "Change")}
        </button>
      </div>
      {children}
    </Card>
  );
}

export function StepReview({
  voices,
  photos,
  text,
  vehicleLabel,
  qualities,
  phone,
  name,
  contact,
  callTime,
  onEdit,
}: {
  voices: VoiceNote[];
  photos: MediaItem[];
  text: string;
  vehicleLabel: string | null;
  qualities: Quality[];
  phone: string;
  name: string;
  contact: PreferredContact;
  callTime: CallTime;
  onEdit: (step: number) => void;
}) {
  const { tx, d, lang } = useT();
  return (
    <div className="space-y-3">
      <Section emoji="🗣️" title={tx("কী লাগবে", "What you need")} onEdit={() => onEdit(1)}>
        <div className="space-y-3">
          {voices.map((v) => (
            <VoicePlayer key={v.id} src={v.url} duration={v.duration_sec} />
          ))}
          {photos.length > 0 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {photos.map((p) => (
                <MediaThumb key={p.id} item={p} />
              ))}
            </div>
          )}
          {text.trim() && <p className="whitespace-pre-line text-lg">{text.trim()}</p>}
        </div>
      </Section>

      <Section emoji="🚗" title={tx("গাড়ি", "Car")} onEdit={() => onEdit(2)}>
        <p className={vehicleLabel ? "font-semibold" : "text-muted"}>{vehicleLabel ?? tx("দেননি (আমরা ফোন করে জেনে নেবো)", "Not given (we'll ask on the phone)")}</p>
      </Section>

      <Section emoji="⭐" title={tx("মান", "Quality")} onEdit={() => onEdit(3)}>
        {qualities.length === 0 ? (
          <p className="font-semibold">{tx("আপনারা সাজেস্ট করুন", "You suggest")}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {qualities.map((q) => (
              <QualityBadge key={q} quality={q} lang={lang} size="lg" />
            ))}
          </div>
        )}
      </Section>

      <Section emoji="📞" title={tx("যোগাযোগ", "Contact")} onEdit={() => onEdit(4)}>
        <p className="text-xl font-bold tracking-wide">{d(displayPhone(phone))}</p>
        {name.trim() && <p>{name.trim()}</p>}
        <p className="mt-1 text-sm text-muted">
          {contactLabel(contact, lang)} · {callTimeLabel(callTime, lang)}
        </p>
      </Section>
    </div>
  );
}
