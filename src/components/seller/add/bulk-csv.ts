// CSV template + parser + row validation for the Excel/CSV upload (file 02 §5.5).
import { categories, generations } from "@/lib/db/queries";
import type { Condition, Grade, Listing, Source } from "@/lib/types";
import { prohibitedCheck } from "../utils";

export const COLUMNS = [
  { key: "id", bn: "আইডি/SKU" },
  { key: "title", bn: "নাম" },
  { key: "category", bn: "ক্যাটাগরি কোড" },
  { key: "vehicle", bn: "গাড়ি কোড" },
  { key: "source", bn: "উৎস" },
  { key: "condition", bn: "অবস্থা" },
  { key: "grade", bn: "গ্রেড" },
  { key: "price", bn: "দাম" },
  { key: "qty", bn: "স্টক" },
  { key: "part_no", bn: "পার্ট নম্বর" },
  { key: "image_url", bn: "ছবির লিংক" },
] as const;
type Key = (typeof COLUMNS)[number]["key"];
export type CsvRow = Partial<Record<Key, string>>;

const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export const templateCsv = () => {
  const head = COLUMNS.map((c) => `${c.bn} (${c.key})`).join(",");
  const ex1 = ["", "Axio E140 ডান হেডলাইট", "lamps--headlight", "gn-axio-e140", "genuine", "used_import", "A", "14500", "1", "", ""];
  const ex2 = ["", "টয়োটা মবিল ফিল্টার", "filters--oil-filter", "all", "genuine", "new", "", "450", "20", "90915-YZZE1", ""];
  const help = [
    "# উৎস: genuine / oem_brand / aftermarket / local_made / unknown",
    "# অবস্থা: new / used_import / used_local / refurbished / for_parts · পুরনো হলে গ্রেড A/B/C/D",
    "# গাড়ি কোড: যেমন gn-axio-e140, সব গাড়িতে হলে all · আগের পণ্য আপডেট করতে আইডি/SKU ঘরে পণ্যের আইডি দিন",
    `# ক্যাটাগরি কোড উদাহরণ: ${categories.filter((c) => c.level === 3).slice(0, 12).map((c) => c.slug).join(" ")}`,
  ];
  return "﻿" + [head, ex1.map(esc).join(","), ex2.map(esc).join(","), ...help].join("\n");
};

/** Minimal RFC-4180 CSV parser (quotes, commas, newlines in quotes). */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === '"' && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()) && !r[0]?.trim().startsWith("#"));
};

export const toObjects = (rows: string[][]): CsvRow[] => {
  if (!rows.length) return [];
  const keys = rows[0].map((h) => {
    const m = h.match(/\(([a-z_]+)\)/);
    const k = (m?.[1] ?? h).trim().toLowerCase();
    return COLUMNS.find((c) => c.key === k || c.bn === h.trim())?.key ?? null;
  });
  return rows.slice(1).map((r) => {
    const o: CsvRow = {};
    keys.forEach((k, i) => {
      if (k && r[i] != null) o[k] = r[i].trim();
    });
    return o;
  });
};

const SOURCES: Source[] = ["genuine", "oem_brand", "aftermarket", "local_made", "unknown"];
const CONDS: Condition[] = ["new", "used_import", "used_local", "refurbished", "for_parts"];

export interface CheckedRow {
  row: CsvRow;
  line: number;
  tone: "ok" | "wait" | "bad";
  reasons: { bn: string; en: string }[];
  update: Listing | null;
}

export const checkRows = (rows: CsvRow[], mine: Listing[], today: number): CheckedRow[] =>
  rows.map((row, i) => {
    const reasons: CheckedRow["reasons"] = [];
    const existing = row.id ? mine.find((l) => l.id === row.id) ?? null : null;
    const price = Number(row.price);
    const qty = row.qty ? Number(row.qty) : 1;
    if (row.id && !existing) reasons.push({ bn: "এই আইডির পণ্য আপনার নেই", en: "No product with this ID" });
    if (existing) {
      if (row.price && !(price > 0)) reasons.push({ bn: "দাম ভুল", en: "Invalid price" });
      if (row.qty && !(qty >= 0)) reasons.push({ bn: "স্টক ভুল", en: "Invalid stock" });
      return { row, line: i + 2, tone: reasons.length ? "bad" : "ok", reasons, update: existing };
    }
    const bad: CheckedRow["reasons"] = [...reasons];
    const warn: CheckedRow["reasons"] = [];
    const cat = categories.find((c) => c.level === 3 && (c.slug === row.category || c.id === row.category));
    if (!row.title) bad.push({ bn: "নাম নেই", en: "Missing title" });
    if (!cat) bad.push({ bn: "ক্যাটাগরি কোড ভুল", en: "Unknown category code" });
    if (!(price > 0)) bad.push({ bn: "দাম নেই (দাম বাধ্যতামূলক)", en: "Price is required" });
    if (!(qty >= 1)) bad.push({ bn: "স্টক কমপক্ষে ১", en: "Stock must be at least 1" });
    if (!SOURCES.includes(row.source as Source)) bad.push({ bn: "উৎস ভুল", en: "Invalid source" });
    if (!CONDS.includes(row.condition as Condition)) bad.push({ bn: "অবস্থা ভুল", en: "Invalid condition" });
    const used = ["used_import", "used_local", "refurbished"].includes(row.condition ?? "");
    if (used && !["A", "B", "C", "D"].includes((row.grade ?? "").toUpperCase())) bad.push({ bn: "পুরনো জিনিসে গ্রেড লাগবে", en: "Used items need a grade" });
    prohibitedCheck({ categoryId: cat?.id ?? null, condition: (row.condition as Condition) ?? null, title: row.title }, today).forEach((p) => (p.block ? bad : warn).push(p));
    if (!row.vehicle) warn.push({ bn: "গাড়ি দেওয়া নেই", en: "No car given" });
    else if (row.vehicle !== "all" && !generations.some((g) => g.id === row.vehicle)) warn.push({ bn: "গাড়ি কোড চেনা যায়নি", en: "Unknown car code" });
    if (!row.image_url) warn.push({ bn: "ছবি নেই, পরে যোগ করুন", en: "No photo, add later" });
    if (!row.part_no) warn.push({ bn: "পার্ট নম্বর নেই", en: "No part number" });
    return { row, line: i + 2, tone: bad.length ? "bad" : warn.length ? "wait" : "ok", reasons: [...bad, ...warn], update: null };
  });

export const gradeOf = (g?: string): Grade | null => (["A", "B", "C", "D"].includes((g ?? "").toUpperCase()) ? ((g ?? "").toUpperCase() as Grade) : null);
