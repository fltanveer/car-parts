import type { AttributeInput, AttributeTemplate, Brand, SizeClass, Source, VehicleTypeCode } from "@/lib/types";

/** Keys understood by `CategoryIcon` (src/components/ui/CategoryIcon.tsx). */
export const ICON_KEYS = [
  "engine", "fuel", "cooling", "exhaust", "transmission", "brake", "suspension", "steering", "tyre", "battery", "electrical", "sensor",
  "light", "body", "mirror", "glass", "interior", "ac", "filter", "fluid", "belt", "hardware", "hybrid", "accessory", "wiper", "doc",
  "box", "shield", "part",
] as const;

type L = { bn: string; en: string };

/** Every attribute template from file 04 section 6. */
export const TEMPLATES: (L & { value: AttributeTemplate })[] = [
  { value: "ENGINE_ASSY", bn: "সম্পূর্ণ ইঞ্জিন", en: "Engine assembly" },
  { value: "TRANSMISSION", bn: "গিয়ারবক্স", en: "Transmission" },
  { value: "BRAKE", bn: "ব্রেক", en: "Brake" },
  { value: "SUSPENSION", bn: "সাসপেনশন", en: "Suspension" },
  { value: "TYRE", bn: "টায়ার", en: "Tyre" },
  { value: "RIM", bn: "রিম", en: "Rim" },
  { value: "BATTERY", bn: "ব্যাটারি", en: "Battery" },
  { value: "ROTATING_ELEC", bn: "ডায়নামো / সেলফ", en: "Alternator / starter" },
  { value: "ELECTRONIC_MODULE", bn: "ECU / সেন্সর / মডিউল", en: "Electronic module" },
  { value: "LAMP_ASSY", bn: "লাইট", en: "Lamp assembly" },
  { value: "BULB", bn: "বাল্ব", en: "Bulb" },
  { value: "FUSE", bn: "ফিউজ", en: "Fuse" },
  { value: "BODY_PANEL", bn: "বডি প্যানেল", en: "Body panel" },
  { value: "MIRROR", bn: "মিরর", en: "Mirror" },
  { value: "GLASS", bn: "গ্লাস", en: "Glass" },
  { value: "INTERIOR", bn: "ভেতরের অংশ", en: "Interior" },
  { value: "AC_PART", bn: "এসি", en: "AC part" },
  { value: "FILTER", bn: "ফিল্টার", en: "Filter" },
  { value: "FLUID", bn: "তেল ও তরল", en: "Fluid" },
  { value: "BELT", bn: "বেল্ট", en: "Belt" },
  { value: "WIPER", bn: "ওয়াইপার", en: "Wiper" },
  { value: "HARDWARE", bn: "নাট-বল্টু-ক্লিপ", en: "Hardware" },
  { value: "IGNITION", bn: "ইগনিশন", en: "Ignition" },
  { value: "GAS_KIT", bn: "সিএনজি/এলপিজি", en: "Gas kit" },
  { value: "HYBRID", bn: "হাইব্রিড", en: "Hybrid" },
  { value: "ACCESSORY", bn: "অ্যাক্সেসরিজ", en: "Accessory" },
  { value: "GENERIC_PART", bn: "অন্য সব", en: "Generic part" },
];
export const templateLabel = (t: AttributeTemplate) => TEMPLATES.find((x) => x.value === t) ?? { value: t, bn: t, en: t };

export const INPUT_TYPES: (L & { value: AttributeInput })[] = [
  { value: "chips", bn: "একটা বাছাই (চিপ)", en: "Single choice (chips)" },
  { value: "multi_chips", bn: "একাধিক বাছাই", en: "Multiple choice" },
  { value: "checklist", bn: "টিক তালিকা", en: "Checklist" },
  { value: "number", bn: "সংখ্যা", en: "Number" },
  { value: "text", bn: "লেখা", en: "Text" },
  { value: "date", bn: "তারিখ", en: "Date" },
];
export const hasOptions = (t: AttributeInput) => t === "chips" || t === "multi_chips" || t === "checklist";

export const SIZE_CLASSES: (L & { value: SizeClass })[] = [
  { value: "small", bn: "ছোট", en: "Small" },
  { value: "medium", bn: "মাঝারি", en: "Medium" },
  { value: "large_heavy", bn: "বড়/ভারী", en: "Large / heavy" },
];

export const VEHICLE_TYPES: Record<VehicleTypeCode, L> = {
  car: { bn: "প্রাইভেট কার", en: "Car" },
  micro: { bn: "মাইক্রোবাস", en: "Microbus" },
  suv: { bn: "SUV / জিপ", en: "SUV / jeep" },
  pickup: { bn: "পিকআপ", en: "Pickup" },
  bike: { bn: "মোটরসাইকেল", en: "Motorcycle" },
  cng: { bn: "সিএনজি অটোরিকশা", en: "CNG auto-rickshaw" },
  bus: { bn: "বাস", en: "Bus" },
  truck: { bn: "ট্রাক", en: "Truck" },
};

export const BRAND_TYPES: Record<Brand["type"], L> = {
  oem_vehicle: { bn: "গাড়ির কোম্পানি", en: "Vehicle maker" },
  oem_supplier: { bn: "নামী সাপ্লায়ার", en: "OEM supplier" },
  aftermarket: { bn: "অন্য ব্র্যান্ড", en: "Aftermarket" },
  local: { bn: "দেশি", en: "Local" },
};

export const SOURCES: Source[] = ["genuine", "oem_brand", "aftermarket", "local_made", "unknown"];
