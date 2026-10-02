import { describeGeneration } from "@/lib/api";
import type { CallTime, Lang, MediaItem, PreferredContact, Quality, UserVehicle, VoiceNote } from "@/lib/types";
import { vehicleLabel } from "../vehicle/VehicleChip";

export type VehicleSel =
  | { kind: "saved"; vehicleId: string }
  | { kind: "picked"; generation_id: string; engine_id: string | null; save: boolean }
  | { kind: "chassis"; generation_id: string | null; chassis_number: string; save: boolean }
  | { kind: "unknown" };

export type InputKind = "voice" | "photo" | "text";

export interface Draft {
  voices: VoiceNote[];
  photos: MediaItem[];
  text: string;
  // undefined = user hasn't touched step 2 yet (fall back to the active car)
  vehicle: VehicleSel | null | undefined;
  qualities: Quality[]; // empty = "you suggest"
  phone: string | null; // null = not edited (fall back to the profile phone)
  name: string;
  contact: PreferredContact;
  callTime: CallTime;
}

export const hasInput = (d: Draft) => d.voices.length > 0 || d.photos.length > 0 || d.text.trim().length > 0;

export const resolveVehicle = (sel: VehicleSel | null, vehicles: UserVehicle[], lang: Lang) => {
  if (!sel) return { generation_id: null, vehicle_text: null, label: null };
  if (sel.kind === "saved") {
    const v = vehicles.find((x) => x.id === sel.vehicleId);
    if (!v) return { generation_id: null, vehicle_text: null, label: null };
    const extra = [v.nickname, v.chassis_number && `Chassis ${v.chassis_number}`, v.needs_admin_setup && "গাড়ি সেট করা বাকি (কাগজের ছবি আছে)"]
      .filter(Boolean)
      .join(" · ");
    return { generation_id: v.generation_id, vehicle_text: extra || null, label: vehicleLabel(v, lang) };
  }
  if (sel.kind === "picked") {
    const g = describeGeneration(sel.generation_id, lang);
    return { generation_id: sel.generation_id, vehicle_text: null, label: g?.full ?? null };
  }
  if (sel.kind === "chassis") {
    const g = describeGeneration(sel.generation_id, lang);
    return {
      generation_id: sel.generation_id,
      vehicle_text: `Chassis ${sel.chassis_number}`,
      label: g ? `${g.full} · ${sel.chassis_number}` : sel.chassis_number,
    };
  }
  return {
    generation_id: null,
    vehicle_text: "জানি না, ভয়েসে/লেখায় বলেছি",
    label: lang === "bn" ? "জানি না, ভয়েসে বলেছি" : "Not sure, said it in the voice note",
  };
};
