import type { Lang } from "./types";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export const toBnDigits = (s: string | number) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
export const toEnDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

// Bangladeshi grouping: 1,23,456
const groupBD = (n: number) => {
  const [int, frac] = Math.round(n).toString().split(".");
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return frac ? `${grouped}.${frac}` : grouped;
};

export const num = (n: number, lang: Lang, bnDigits = true) => {
  const s = groupBD(n);
  return lang === "bn" && bnDigits ? toBnDigits(s) : s;
};

export const taka = (n: number, lang: Lang, bnDigits = true) => `৳ ${num(n, lang, bnDigits)}`;

export const digits = (s: string | number, lang: Lang, bnDigits = true) =>
  lang === "bn" && bnDigits ? toBnDigits(s) : String(s);

export const range = (a: number, b: number, lang: Lang, bnDigits = true) =>
  lang === "bn" ? `${digits(a, lang, bnDigits)} থেকে ${digits(b, lang, bnDigits)}` : `${a}–${b}`;

export const formatDate = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });

export const formatDateTime = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });

// Normalise any BD mobile input to +8801XXXXXXXXX; null when invalid.
export const normalizePhone = (input: string): string | null => {
  const d = toEnDigits(input).replace(/\D/g, "");
  const local = d.startsWith("880") ? d.slice(2) : d.startsWith("0") ? d : `0${d}`;
  return /^01[3-9]\d{8}$/.test(local) ? `+88${local}` : null;
};

export const displayPhone = (e164: string) => e164.replace(/^\+88/, "");
