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

/** "৫ মিনিট আগে" / "in 3 h". Negative = past, positive = future. */
export const relTime = (iso: string, lang: Lang, bnDigits = true, now = Date.now()) => {
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60_000);
  const hr = Math.round(abs / 3_600_000);
  const day = Math.round(abs / 86_400_000);
  const [n, unitBn, unitEn] = min < 60 ? [min, "মিনিট", "min"] : hr < 48 ? [hr, "ঘণ্টা", "h"] : [day, "দিন", "d"];
  const v = digits(n, lang, bnDigits);
  if (lang === "bn") return diff < 0 ? `${v} ${unitBn} আগে` : `${v} ${unitBn} বাকি`;
  return diff < 0 ? `${v} ${unitEn} ago` : `${v} ${unitEn} left`;
};

/** Bangla number words for read-aloud prices: 4200 → "চার হাজার দুইশো". */
const ONES = ["", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ", "বিশ"];
const TENS = ["", "", "বিশ", "ত্রিশ", "চল্লিশ", "পঞ্চাশ", "ষাট", "সত্তর", "আশি", "নব্বই"];
const twoDigit = (n: number) => (n <= 20 ? ONES[n] : n % 10 === 0 ? TENS[Math.floor(n / 10)] : `${TENS[Math.floor(n / 10)]} ${ONES[n % 10]}`);
export const bnWords = (n: number): string => {
  n = Math.round(n);
  if (n === 0) return "শূন্য";
  const parts: string[] = [];
  const lakh = Math.floor(n / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  if (lakh) parts.push(`${twoDigit(lakh)} লাখ`);
  if (thousand) parts.push(`${twoDigit(thousand)} হাজার`);
  if (hundred) parts.push(`${ONES[hundred]}শো`);
  if (rest) parts.push(twoDigit(rest));
  return parts.join(" ");
};
export const spokenTaka = (n: number, lang: Lang) => (lang === "bn" ? `${bnWords(n)} টাকা` : `${n} taka`);

// Normalise any BD mobile input to +8801XXXXXXXXX; null when invalid.
export const normalizePhone = (input: string): string | null => {
  const d = toEnDigits(input).replace(/\D/g, "");
  const local = d.startsWith("880") ? d.slice(2) : d.startsWith("0") ? d : `0${d}`;
  return /^01[3-9]\d{8}$/.test(local) ? `+88${local}` : null;
};

export const displayPhone = (e164: string) => e164.replace(/^\+88/, "");
