"use client";

import { Bell, Camera, FileText } from "lucide-react";
import { useState } from "react";
import { docTypeLabel } from "@/lib/labels";
import type { MediaItem, UserVehicle, VehicleDocType, VehicleDocument } from "@/lib/types";
import type { Tone } from "@/lib/labels";
import { PhotoUploader } from "@/components/media/PhotoUploader";
import { toast, useNow } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, Field, Input, StatusPill } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { setDocExpiry, uploadDocPhoto } from "./actions";

const DAY = 86_400_000;
const REMINDER_DAYS = [30, 7, 1]; // file 01 3.1
const ALL_DOCS: VehicleDocType[] = ["registration", "tax_token", "fitness", "insurance", "route_permit", "driving_license"];

export const docStatus = (doc: VehicleDocument | undefined, now: number): { tone: Tone; days: number | null } => {
  if (!doc || (doc.status === "missing" && !doc.expires_on)) return { tone: "info", days: null };
  if (!doc.expires_on) return { tone: doc.status === "pending_review" ? "wait" : "ok", days: null };
  const days = Math.ceil((new Date(doc.expires_on).getTime() - now) / DAY);
  return { tone: days < 0 ? "bad" : days <= 30 ? "wait" : "ok", days };
};

const toneCard: Record<Tone, string> = { ok: "border-ok/40", wait: "border-wait-bg/60", bad: "border-bad/50 bg-bad-soft/40", info: "border-line" };

/** Papers with colour status, expiry and 30/7/1-day reminders (file 01 3.1). */
export function GaragePapers({ vehicle, ownerPhone }: { vehicle: UserVehicle; ownerPhone: string }) {
  const { tx, L, d, date } = useT();
  const now = useNow();
  const [edit, setEdit] = useState<VehicleDocType | null>(null);

  const text = (doc: VehicleDocument | undefined, s: ReturnType<typeof docStatus>) => {
    if (!doc || (doc.status === "missing" && !doc.expires_on)) return tx("যোগ করা হয়নি", "Not added");
    if (doc.status === "pending_review" && !doc.expires_on) return tx("টিম তারিখ বসাচ্ছে", "Team is reading the date");
    if (s.days === null) return tx("মেয়াদ নেই", "No expiry");
    if (s.days < 0) return tx(`মেয়াদ ${d(-s.days)} দিন আগে শেষ`, `Expired ${-s.days} days ago`);
    return tx(`${d(s.days)} দিন বাকি`, `${s.days} days left`);
  };

  return (
    <>
      <ul className="grid gap-2 sm:grid-cols-2">
        {ALL_DOCS.map((t) => {
          const doc = vehicle.documents.find((x) => x.doc_type === t);
          const st = docStatus(doc, now);
          return (
            <li key={t}>
              <button type="button" onClick={() => setEdit(t)} className={`flex w-full items-start gap-3 rounded-2xl border-2 bg-card p-3 text-left hover:border-ink/30 ${toneCard[st.tone]}`}>
                <FileText className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{L(docTypeLabel[t])}</span>
                  {doc?.expires_on && <span className="block text-sm text-ink-2">{date(doc.expires_on)}</span>}
                  <StatusPill tone={st.tone} className="mt-1">{text(doc, st)}</StatusPill>
                  {st.days !== null && st.days >= 0 && (
                    <span className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted">
                      <Bell className="size-3" aria-hidden />
                      {REMINDER_DAYS.map((r) => (
                        <span key={r} className={st.days! < r ? "line-through" : ""}>
                          {tx(`${d(r)} দিন আগে`, `${r}d before`)}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">{tx("মেয়াদ শেষের ৩০, ৭ ও ১ দিন আগে SMS ও অ্যাপে মনে করিয়ে দেবো।", "We'll remind you by SMS and in the app 30, 7 and 1 day before expiry.")}</p>
      {edit && <DocSheet vehicle={vehicle} ownerPhone={ownerPhone} docType={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function DocSheet({ vehicle, ownerPhone, docType, onClose }: { vehicle: UserVehicle; ownerPhone: string; docType: VehicleDocType; onClose: () => void }) {
  const { tx, L } = useT();
  const doc = vehicle.documents.find((x) => x.doc_type === docType);
  const [dateVal, setDateVal] = useState(doc?.expires_on ? doc.expires_on.slice(0, 10) : "");
  const [photos, setPhotos] = useState<MediaItem[]>(doc?.file_url ? [{ id: "doc", url: doc.file_url, kind: "image", name: L(docTypeLabel[docType]) }] : []);
  const save = () => {
    const newPhoto = photos[0] && photos[0].url !== doc?.file_url ? photos[0].url : null;
    if (dateVal) setDocExpiry(vehicle.id, docType, new Date(`${dateVal}T12:00:00+06:00`).toISOString(), newPhoto ?? undefined);
    else if (newPhoto) uploadDocPhoto(vehicle.id, ownerPhone, docType, newPhoto);
    toast(dateVal ? tx("সেভ হয়েছে", "Saved") : newPhoto ? tx("ছবি পেয়েছি, টিম তারিখ বসাবে", "Got the photo, the team will add the date") : tx("কিছু বদলায়নি", "Nothing changed"), dateVal || newPhoto ? "ok" : "info");
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title={L(docTypeLabel[docType])}>
      <div className="space-y-4 pb-2">
        <div>
          <p className="mb-2 flex items-center gap-1.5 font-semibold">
            <Camera className="size-4" aria-hidden /> {tx("কাগজের ছবি দিন (তারিখ আমরা বসাবো)", "Add a photo (we'll fill the date)")}
          </p>
          <PhotoUploader value={photos} onChange={(p) => setPhotos(p.slice(-1))} max={1} />
        </div>
        <Field label={tx("অথবা মেয়াদের তারিখ নিজে দিন", "Or enter the expiry date")}>
          <Input type="date" value={dateVal} onChange={(e) => setDateVal(e.target.value)} />
        </Field>
        <Button variant="outline" size="md" full disabled title={tx("ফেজ ৩", "Phase 3")}>
          📄 {tx("নবায়ন করে দিন (শীঘ্রই আসছে)", "Renew for me (coming soon)")}
        </Button>
        <Button variant="brand" size="lg" full onClick={save}>
          {tx("সেভ করুন", "Save")}
        </Button>
      </div>
    </Sheet>
  );
}
