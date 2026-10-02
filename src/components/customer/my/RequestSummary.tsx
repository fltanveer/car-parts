"use client";

import { Car } from "lucide-react";
import { describeVehicle, getCategory } from "@/lib/db/queries";
import { conditionPrefLabel, neededByLabel, positionLabel, sourcePrefLabel } from "@/lib/labels";
import type { PartRequest } from "@/lib/types";
import { MediaThumb } from "../../media/PhotoUploader";
import { VoicePlayer } from "../../media/VoicePlayer";
import { useT } from "../../providers/LangProvider";
import { Card } from "../../ui/primitives";

export const vehicleText = (r: Pick<PartRequest, "generation_id" | "engine_id" | "vehicle_text">, lang: "bn" | "en") =>
  describeVehicle(r.generation_id, r.engine_id, lang)?.full ?? r.vehicle_text ?? (lang === "bn" ? "গাড়ি জানা নেই" : "Vehicle not set");

/** Top of /request/[id]: car, what was asked, your own voice ▶️. */
export function RequestSummary({ r }: { r: PartRequest }) {
  const { tx, lang, L } = useT();
  const what = r.description_text ?? r.summary_bn ?? (r.voice_notes.length ? tx("ভয়েসে বলা হয়েছে", "Said by voice") : r.photos.length ? tx("ছবি দেওয়া হয়েছে", "Sent as photos") : "—");
  return (
    <Card className="space-y-3 p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Car className="size-5 text-brand" aria-hidden /> {vehicleText(r, lang)}
      </p>
      <p className="text-lg font-bold">{what}</p>
      {r.items.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {r.items.map((it, i) => (
            <li key={i} className="rounded-full bg-surface px-3 py-1 text-sm font-semibold">
              🔧 {it.name || (lang === "bn" ? getCategory(it.category_id)?.name_bn : getCategory(it.category_id)?.name)}
              {it.position.length > 0 && <span className="text-muted"> · {it.position.map((p) => L(positionLabel[p])).join(", ")}</span>}
            </li>
          ))}
        </ul>
      )}
      {r.voice_notes.map((v) =>
        v.url ? (
          <div key={v.id}>
            <p className="mb-1 text-sm font-semibold text-muted">🎤 {tx("আপনার ভয়েস", "Your voice")}</p>
            <VoicePlayer src={v.url} duration={v.duration_sec} />
          </div>
        ) : (
          <p key={v.id} className="text-sm text-muted">🎤 {tx("ভয়েস নোট টিমের কাছে আছে", "Voice note is with our team")}</p>
        ),
      )}
      {r.photos.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {r.photos.map((m) => (
            <MediaThumb key={m.id} item={m} />
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
        <span className="rounded-md bg-surface px-2 py-1">🏷️ {L(sourcePrefLabel[r.preferred_source])}</span>
        <span className="rounded-md bg-surface px-2 py-1">♻️ {L(conditionPrefLabel[r.preferred_condition])}</span>
        <span className="rounded-md bg-surface px-2 py-1">⏰ {L(neededByLabel[r.needed_by])}</span>
        <span className="rounded-md bg-surface px-2 py-1">📍 {r.area}, {r.district}</span>
      </div>
    </Card>
  );
}
