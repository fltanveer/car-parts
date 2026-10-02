// /request wizard state + localStorage autosave (rule 9: drafts never lost).
import type { ConditionPreference, MediaItem, NeededBy, SourcePreference, VoiceNote } from "@/lib/types";

export type HowMode = "voice" | "photo" | "text";

export interface Draft {
  step: number; // 0..4
  mode: HowMode;
  text: string;
  voice: VoiceNote[];
  photos: MediaItem[];
  categoryId: string | null;
  vehicleMode: "mine" | "pick" | "text" | "unknown" | null;
  userVehicleId: string | null;
  generationId: string | null;
  engineId: string | null;
  vehicleText: string;
  source: SourcePreference | null;
  condition: ConditionPreference | null;
  neededBy: NeededBy | null;
  name: string;
  phone: string;
  district: string;
  area: string;
}

export type SetDraft = (patch: Partial<Draft>) => void;

const KEY = "gaarihub:requestDraft";

export const emptyDraft = (): Draft => ({
  step: 0, mode: "voice", text: "", voice: [], photos: [], categoryId: null,
  vehicleMode: null, userVehicleId: null, generationId: null, engineId: null, vehicleText: "",
  source: null, condition: null, neededBy: null, name: "", phone: "", district: "ঢাকা", area: "",
});

export const loadDraft = (mode: string | null, q: string | null): Draft => {
  let d = emptyDraft();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) d = { ...d, ...(JSON.parse(raw) as Partial<Draft>) };
  } catch {
    /* ignore broken draft */
  }
  // URL wins over the saved draft for how the request starts.
  if (mode === "voice" || mode === "photo" || mode === "text") d = { ...d, mode, step: q ? d.step : 0 };
  if (q) d = { ...d, mode: "text", text: q, step: 0 };
  return d;
};

export const saveDraft = (d: Draft) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage full */
  }
};

export const clearDraft = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};

export const hasWhat = (d: Draft) => d.voice.length > 0 || d.photos.length > 0 || d.text.trim().length >= 3;
