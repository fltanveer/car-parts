"use client";

// Small customer-only writes that the shared actions.ts doesn't cover.
// Built on `update()` so they stay in the same mock store.
import { iso } from "@/lib/db/seed";
import { update } from "@/lib/db/store";
import type { Profile } from "@/lib/types";

export const updateProfile = (phone: string, patch: Partial<Omit<Profile, "phone">>) =>
  update((s) => ({ profiles: s.profiles.map((p) => (p.phone === phone ? { ...p, ...patch } : p)) }));

/** Phase-2/3 interest sign-up (file 01 §10): which service, which area. */
export const registerInterest = (service: string, area: string, phone: string) =>
  update((s) => ({ serviceInterest: [{ service, area, phone, at: iso() }, ...s.serviceInterest] }));

// Guests can send requests with only a phone number (file 01 §5.1); we remember
// it on this device so "my stuff" can show those requests without a login.
const GUEST_KEY = "gaarihub:guestPhone";
export const getGuestPhone = () => {
  try {
    return localStorage.getItem(GUEST_KEY);
  } catch {
    return null;
  }
};
export const setGuestPhone = (phone: string) => {
  try {
    localStorage.setItem(GUEST_KEY, phone);
  } catch {
    /* private mode: fine */
  }
};
