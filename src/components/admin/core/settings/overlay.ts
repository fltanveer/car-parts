"use client";

// Admin-only editable state for the settings area (file 03 §21) that has no
// DB table in the mock store. Each piece is a localStorage overlay seeded from
// the static modules; every write goes through a helper that also audits.
import { audit } from "@/lib/db/actions";
import { createOverlay, settingsOverlay, type AppSettings } from "@/lib/db/actions-admin-core";
import { deliveryRates, fulfillmentExtra, markets, quoteWeights, vendorScoreWeights } from "@/lib/mock/settings";
import { prohibitedRules } from "@/lib/mock/taxonomy";
import type { Fulfillment } from "@/lib/types";
import { defaultPolicies, type PolicyKey, type PolicyVersion } from "./policyDefaults";
import { defaultTemplates, type MsgTemplate } from "./templateDefaults";
import { defaultChecklist, type ChecklistSection } from "./checklistDefaults";

// ---------- settings value reset (remove override) ----------
export const resetAdminSetting = (k: keyof AppSettings) => {
  settingsOverlay.set((s) => {
    const values = { ...s.values };
    delete values[k];
    return { values };
  });
  audit("সেটিং ডিফল্টে ফেরানো", String(k));
};

// ---------- commission plans ----------
export interface CommissionPlan {
  id: string;
  name_bn: string;
  name_en: string;
  percent: number;
  kind: "default" | "promo" | "custom";
}
export const commissionOverlay = createOverlay("commission", () => ({
  promo_months: 3,
  categoryOverrides: {} as Record<string, number>,
  customPlans: [] as CommissionPlan[],
  assignments: {} as Record<string, string>, // vendorId → planId
}));
export const setPromoMonths = (n: number) => {
  commissionOverlay.set(() => ({ promo_months: n }));
  audit("কমিশন: প্রচারের মেয়াদ", `${n} মাস`);
};
export const setCategoryCommission = (catId: string, pct: number | null) => {
  commissionOverlay.set((s) => {
    const next = { ...s.categoryOverrides };
    if (pct === null) delete next[catId];
    else next[catId] = pct;
    return { categoryOverrides: next };
  });
  audit("কমিশন: ক্যাটাগরি ওভাররাইড", `${catId} = ${pct === null ? "ডিফল্ট" : `${pct}%`}`);
};
export const addCommissionPlan = (p: CommissionPlan) => {
  commissionOverlay.set((s) => ({ customPlans: [...s.customPlans, p] }));
  audit("কমিশন প্ল্যান তৈরি", `${p.name_bn} (${p.percent}%)`);
};
export const removeCommissionPlan = (id: string) => {
  const p = commissionOverlay.get().customPlans.find((x) => x.id === id);
  commissionOverlay.set((s) => ({ customPlans: s.customPlans.filter((x) => x.id !== id) }));
  audit("কমিশন প্ল্যান মুছে ফেলা", p?.name_bn ?? id);
};
export const recordAssignment = (vendorId: string, planId: string) =>
  commissionOverlay.set((s) => ({ assignments: { ...s.assignments, [vendorId]: planId } }));

// ---------- policies (versioned) ----------
export const policiesOverlay = createOverlay("policies", () => ({ versions: defaultPolicies() }));
export const savePolicyVersion = (key: PolicyKey, text: string, by: string, at: string) => {
  let n = 1;
  policiesOverlay.set((s) => {
    const list = s.versions[key] ?? [];
    n = (list[0]?.v ?? 0) + 1;
    const next: PolicyVersion = { v: n, text, at, by };
    return { versions: { ...s.versions, [key]: [next, ...list] } };
  });
  audit("পলিসি নতুন সংস্করণ", `${key} v${n}`);
  return n;
};

// ---------- notification templates ----------
export const templatesOverlay = createOverlay("templates", () => ({ templates: defaultTemplates() }));
export const saveTemplate = (id: string, patch: Partial<MsgTemplate>, what: string) => {
  templatesOverlay.set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  audit(`টেমপ্লেট ${what}`, id);
};

// ---------- delivery rates ----------
export type RateRow = (typeof deliveryRates)[number];
export const deliveryOverlay = createOverlay("delivery", () => ({
  rates: deliveryRates.map((r) => ({ ...r })) as RateRow[],
  extras: { ...fulfillmentExtra } as Record<Fulfillment, number>,
}));
export const saveRate = (i: number, patch: Partial<RateRow>) => {
  const row = deliveryOverlay.get().rates[i];
  deliveryOverlay.set((s) => ({ rates: s.rates.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  audit("ডেলিভারি রেট পরিবর্তন", `${row.zone}/${row.size_class}: ${JSON.stringify(patch)}`);
};
export const saveExtra = (f: Fulfillment, v: number) => {
  deliveryOverlay.set((s) => ({ extras: { ...s.extras, [f]: v } }));
  audit("fulfillment চার্জ পরিবর্তন", `${f} = ${v}`);
};

// ---------- prohibited / restricted items ----------
export interface ItemRule {
  id: string;
  bn: string;
  en: string;
  rule_bn: string;
  rule_en: string;
  enforced: boolean;
}
export const itemsOverlay = createOverlay("items", () => ({
  rules: prohibitedRules.map((r, i) => ({ ...r, id: `pr-${i + 1}`, enforced: true })) as ItemRule[],
}));
export const toggleItemRule = (id: string, enforced: boolean) => {
  const r = itemsOverlay.get().rules.find((x) => x.id === id);
  itemsOverlay.set((s) => ({ rules: s.rules.map((x) => (x.id === id ? { ...x, enforced } : x)) }));
  audit(enforced ? "নিষিদ্ধ নিয়ম চালু" : "নিষিদ্ধ নিয়ম বন্ধ", r?.bn ?? id);
};
export const addItemRule = (r: ItemRule) => {
  itemsOverlay.set((s) => ({ rules: [...s.rules, r] }));
  audit("নিষিদ্ধ/সীমিত জিনিস যোগ", r.bn);
};

// ---------- market areas ----------
export type Market = (typeof markets)[number];
export const marketsOverlay = createOverlay("markets", () => ({ markets: markets.map((m) => ({ ...m, slots: [...m.slots] })) as Market[] }));
export const saveMarket = (m: Market, isNew: boolean) => {
  marketsOverlay.set((s) => ({ markets: isNew ? [...s.markets, m] : s.markets.map((x) => (x.id === m.id ? m : x)) }));
  audit(isNew ? "বাজার যোগ" : "বাজার সম্পাদনা", `${m.bn} · ${m.slots.join(", ") || "-"}`);
};

// ---------- audio guide files ----------
export interface AudioFile {
  url: string;
  duration: number;
  at: string;
  by: string;
}
export const audioOverlay = createOverlay("audio", () => ({ files: {} as Record<string, AudioFile> }));
export const setAudioFile = (screen: string, f: AudioFile | null) => {
  audioOverlay.set((s) => {
    const files = { ...s.files };
    if (f) files[screen] = f;
    else delete files[screen];
    return { files };
  });
  audit(f ? "অডিও গাইড আপলোড" : "অডিও গাইড মুছে ফেলা", screen);
};

// ---------- score weights ----------
export type QuoteWeights = typeof quoteWeights;
export type VendorWeights = typeof vendorScoreWeights;
export const weightsOverlay = createOverlay("weights", () => ({ quote: { ...quoteWeights }, vendor: { ...vendorScoreWeights } }));
export const saveWeights = (which: "quote" | "vendor", w: Record<string, number>) => {
  weightsOverlay.set(() => ({ [which]: w }) as Partial<{ quote: QuoteWeights; vendor: VendorWeights }>);
  audit(which === "quote" ? "সেরা পছন্দ স্কোরের ওজন পরিবর্তন" : "বিক্রেতা স্কোরের ওজন পরিবর্তন", JSON.stringify(w));
};

// ---------- inspection checklist template (phase 2 preview) ----------
export const checklistOverlay = createOverlay("inspection-checklist", () => ({ sections: defaultChecklist() as ChecklistSection[] }));
export const saveChecklist = (sections: ChecklistSection[], what: string) => {
  checklistOverlay.set(() => ({ sections }));
  audit("ইন্সপেকশন চেকলিস্ট টেমপ্লেট", what);
};

