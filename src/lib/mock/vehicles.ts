import type { VehicleEngine, VehicleGeneration, VehicleMake, VehicleModel } from "../types";

export const makes: VehicleMake[] = [
  { id: "mk-toyota", name: "Toyota", name_bn: "টয়োটা", slug: "toyota" },
  { id: "mk-honda", name: "Honda", name_bn: "হোন্ডা", slug: "honda" },
  { id: "mk-nissan", name: "Nissan", name_bn: "নিসান", slug: "nissan" },
  { id: "mk-mitsubishi", name: "Mitsubishi", name_bn: "মিৎসুবিশি", slug: "mitsubishi" },
  { id: "mk-suzuki", name: "Suzuki", name_bn: "সুজুকি", slug: "suzuki" },
];

const m = (id: string, make_id: string, name: string, name_bn: string, is_popular = true): VehicleModel => ({
  id,
  make_id,
  name,
  name_bn,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  is_popular,
});

export const models: VehicleModel[] = [
  m("md-axio", "mk-toyota", "Axio", "এক্সিও"),
  m("md-premio", "mk-toyota", "Premio", "প্রিমিও"),
  m("md-allion", "mk-toyota", "Allion", "এলিয়ন"),
  m("md-corolla", "mk-toyota", "X Corolla", "এক্স করোলা"),
  m("md-fielder", "mk-toyota", "Fielder", "ফিল্ডার"),
  m("md-noah", "mk-toyota", "Noah", "নোয়া"),
  m("md-voxy", "mk-toyota", "Voxy", "ভক্সি"),
  m("md-probox", "mk-toyota", "Probox", "প্রোবক্স"),
  m("md-aqua", "mk-toyota", "Aqua", "অ্যাকুয়া"),
  m("md-harrier", "mk-toyota", "Harrier", "হ্যারিয়ার"),
  m("md-vezel", "mk-honda", "Vezel", "ভেজেল"),
  m("md-grace", "mk-honda", "Grace", "গ্রেস", false),
  m("md-fit", "mk-honda", "Fit", "ফিট", false),
  m("md-xtrail", "mk-nissan", "X-Trail", "এক্স-ট্রেইল", false),
  m("md-sunny", "mk-nissan", "Sunny", "সানি", false),
  m("md-pajero", "mk-mitsubishi", "Pajero", "পাজেরো", false),
  m("md-swift", "mk-suzuki", "Swift", "সুইফট", false),
];

const g = (
  id: string,
  model_id: string,
  label: string,
  year_from: number,
  year_to: number | null,
  chassis_codes: string[],
): VehicleGeneration => ({ id, model_id, label, year_from, year_to, chassis_codes });

export const generations: VehicleGeneration[] = [
  g("gn-axio-e140", "md-axio", "E140", 2006, 2012, ["NZE141", "NZE144", "ZRE142"]),
  g("gn-axio-e160", "md-axio", "E160", 2012, 2019, ["NKE165", "NZE161", "NZE164"]),
  g("gn-premio-t260", "md-premio", "T260", 2007, 2021, ["NZT260", "ZRT260", "ZRT261"]),
  g("gn-premio-t240", "md-premio", "T240", 2001, 2007, ["NZT240", "ZZT240"]),
  g("gn-allion-t260", "md-allion", "T260", 2007, 2021, ["NZT260", "ZRT260", "ZRT261"]),
  g("gn-corolla-e110", "md-corolla", "E110", 1995, 2000, ["AE110", "AE111"]),
  g("gn-fielder-e160", "md-fielder", "E160", 2012, 2019, ["NKE165", "NZE161", "NZE164"]),
  g("gn-noah-r70", "md-noah", "R70", 2007, 2013, ["ZRR70", "ZRR75"]),
  g("gn-noah-r80", "md-noah", "R80", 2014, 2021, ["ZRR80", "ZWR80"]),
  g("gn-voxy-r80", "md-voxy", "R80", 2014, 2021, ["ZRR80", "ZWR80"]),
  g("gn-probox-50", "md-probox", "XP50", 2002, 2014, ["NCP50", "NCP51", "NCP55"]),
  g("gn-probox-160", "md-probox", "XP160", 2014, null, ["NCP160", "NSP160", "NHP160"]),
  g("gn-aqua-p10", "md-aqua", "P10", 2011, 2021, ["NHP10"]),
  g("gn-harrier-xu60", "md-harrier", "XU60", 2013, 2020, ["ZSU60", "AVU65"]),
  g("gn-vezel-ru", "md-vezel", "RU", 2013, 2021, ["RU1", "RU3"]),
  g("gn-grace-gm", "md-grace", "GM", 2014, 2020, ["GM4", "GM6"]),
  g("gn-fit-gp5", "md-fit", "GP5", 2013, 2020, ["GP5", "GK3"]),
  g("gn-xtrail-t32", "md-xtrail", "T32", 2013, 2021, ["NT32", "HNT32"]),
  g("gn-sunny-n17", "md-sunny", "N17", 2011, 2019, ["N17"]),
  g("gn-pajero-v90", "md-pajero", "V90", 2006, 2021, ["V93W", "V97W"]),
  g("gn-swift-zc", "md-swift", "ZC", 2017, null, ["ZC83S", "ZC13S"]),
];

const e = (
  id: string,
  generation_id: string,
  code: string,
  displacement_cc: number,
  fuel_type: VehicleEngine["fuel_type"] = "petrol",
): VehicleEngine => ({ id, generation_id, code, displacement_cc, fuel_type });

export const engines: VehicleEngine[] = [
  e("en-axio140-1nz", "gn-axio-e140", "1NZ-FE", 1500),
  e("en-axio140-2zr", "gn-axio-e140", "2ZR-FE", 1800),
  e("en-axio160-1nz", "gn-axio-e160", "1NZ-FE", 1500),
  e("en-axio160-1nzfxe", "gn-axio-e160", "1NZ-FXE", 1500, "hybrid"),
  e("en-premio260-1nz", "gn-premio-t260", "1NZ-FE", 1500),
  e("en-premio260-2zr", "gn-premio-t260", "2ZR-FE", 1800),
  e("en-allion260-1nz", "gn-allion-t260", "1NZ-FE", 1500),
  e("en-allion260-2zr", "gn-allion-t260", "2ZR-FE", 1800),
  e("en-noah70-3zr", "gn-noah-r70", "3ZR-FAE", 2000),
  e("en-noah80-3zr", "gn-noah-r80", "3ZR-FAE", 2000),
  e("en-noah80-2zr", "gn-noah-r80", "2ZR-FXE", 1800, "hybrid"),
  e("en-probox50-1nz", "gn-probox-50", "1NZ-FE", 1500),
  e("en-aqua-1nz", "gn-aqua-p10", "1NZ-FXE", 1500, "hybrid"),
  e("en-vezel-leb", "gn-vezel-ru", "LEB", 1500, "hybrid"),
];
