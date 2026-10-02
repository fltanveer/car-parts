import type { AttributeDefinition, AttributeTemplate, Category, SizeClass } from "../types";

// Category tree from file 04 section 5: division → group → item.
// Items are a working subset; the catalog team extends it from the admin panel.
type ItemDef = [bn: string, en: string, synonyms?: string[]];
interface GroupDef {
  slug: string;
  bn: string;
  en: string;
  template: AttributeTemplate;
  position?: boolean;
  size?: SizeClass;
  electrical?: boolean;
  restricted?: boolean;
  video?: boolean;
  items: ItemDef[];
}
interface DivisionDef {
  slug: string;
  bn: string;
  en: string;
  icon: string;
  groups: GroupDef[];
}

const tree: DivisionDef[] = [
  {
    slug: "engine", bn: "ইঞ্জিন", en: "Engine", icon: "engine",
    groups: [
      { slug: "engine-assembly", bn: "সম্পূর্ণ ইঞ্জিন", en: "Complete engine", template: "ENGINE_ASSY", size: "large_heavy", restricted: true, video: true,
        items: [["ফুল ইঞ্জিন", "Full engine", ["ইঞ্জিন", "মেশিন"]], ["ইঞ্জিন + গিয়ারবক্স", "Engine + gearbox"], ["লং ব্লক", "Long block"], ["শর্ট ব্লক", "Short block"], ["হাইব্রিড ইঞ্জিন", "Hybrid engine"]] },
      { slug: "cylinder-head", bn: "সিলিন্ডার হেড ও ভাল্ভ", en: "Cylinder head & valves", template: "GENERIC_PART", size: "medium",
        items: [["সিলিন্ডার হেড", "Cylinder head"], ["ভাল্ভ সিল", "Valve stem seal"], ["ক্যামশ্যাফট", "Camshaft"], ["VVT গিয়ার", "VVT gear"], ["ভাল্ভ কভার গ্যাসকেট", "Valve cover gasket", ["টপ কভার গ্যাসকেট"]], ["অয়েল ফিলার ক্যাপ", "Oil filler cap"]] },
      { slug: "engine-block", bn: "ব্লক ও ভেতরের অংশ", en: "Block & internals", template: "GENERIC_PART",
        items: [["পিস্টন", "Piston"], ["পিস্টন রিং সেট", "Piston ring set"], ["কন-রড বেয়ারিং", "Con-rod bearing"], ["ক্র্যাংকশ্যাফট", "Crankshaft"], ["অয়েল প্যান", "Oil pan", ["সাম্প"]], ["অয়েল পাম্প", "Oil pump"]] },
      { slug: "timing", bn: "টাইমিং", en: "Timing", template: "GENERIC_PART",
        items: [["টাইমিং চেইন", "Timing chain"], ["চেইন টেনশনার", "Chain tensioner"], ["টাইমিং বেল্ট", "Timing belt"], ["টাইমিং কিট", "Timing kit"]] },
      { slug: "gaskets", bn: "গ্যাসকেট ও সিল", en: "Gaskets & seals", template: "GENERIC_PART", size: "small",
        items: [["ফুল গ্যাসকেট কিট", "Full gasket kit"], ["হেড গ্যাসকেট", "Head gasket"], ["অয়েল সিল", "Oil seal"], ["ও-রিং সেট", "O-ring set"]] },
      { slug: "engine-mount", bn: "ইঞ্জিন মাউন্ট", en: "Engine mounts", template: "GENERIC_PART", position: true,
        items: [["সামনের মাউন্ট", "Front mount"], ["পেছনের মাউন্ট", "Rear mount"], ["ডান/বাম মাউন্ট", "Side mount"], ["টর্ক রড", "Torque rod"]] },
      { slug: "intake-turbo", bn: "ইনটেক ও টার্বো", en: "Intake & turbo", template: "GENERIC_PART",
        items: [["থ্রটল বডি", "Throttle body"], ["টার্বোচার্জার", "Turbocharger"], ["ইন্টারকুলার", "Intercooler"], ["PCV ভাল্ভ", "PCV valve"], ["ডিপস্টিক", "Dipstick"]] },
      { slug: "ignition", bn: "ইগনিশন", en: "Ignition", template: "IGNITION", size: "small", electrical: true,
        items: [["স্পার্ক প্লাগ", "Spark plug", ["প্লাগ"]], ["ইগনিশন কয়েল", "Ignition coil", ["কয়েল"]], ["প্লাগ তার সেট", "Plug wire set"]] },
    ],
  },
  {
    slug: "fuel", bn: "জ্বালানি ও গ্যাস কিট", en: "Fuel & CNG/LPG", icon: "fuel",
    groups: [
      { slug: "fuel-system", bn: "পেট্রোল/ডিজেল", en: "Petrol / diesel", template: "GENERIC_PART",
        items: [["ফুয়েল পাম্প", "Fuel pump", ["তেলের পাম্প"]], ["ফুয়েল ফিল্টার", "Fuel filter"], ["ইনজেক্টর", "Injector"], ["ফুয়েল ট্যাংক", "Fuel tank"], ["গ্লো প্লাগ", "Glow plug"]] },
      { slug: "gas-kit", bn: "সিএনজি / এলপিজি কিট", en: "CNG / LPG kit", template: "GAS_KIT", restricted: true,
        items: [["সম্পূর্ণ কনভার্শন কিট", "Full conversion kit"], ["সিলিন্ডার", "Cylinder", ["গ্যাস সিলিন্ডার"]], ["রিডিউসার", "Reducer"], ["সোলেনয়েড ভাল্ভ", "Solenoid valve"], ["চেঞ্জওভার সুইচ", "Changeover switch"]] },
    ],
  },
  {
    slug: "cooling", bn: "কুলিং", en: "Cooling", icon: "cooling",
    groups: [
      { slug: "cooling-system", bn: "কুলিং সিস্টেম", en: "Cooling system", template: "GENERIC_PART",
        items: [["রেডিয়েটর", "Radiator", ["রেডিয়েটার"]], ["রেডিয়েটর ফ্যান", "Radiator fan"], ["ওয়াটার পাম্প", "Water pump", ["পানির পাম্প"]], ["থার্মোস্ট্যাট", "Thermostat"], ["কুল্যান্ট রিজার্ভার", "Coolant reservoir", ["পানির বোতল"]], ["রেডিয়েটর হোস", "Radiator hose"]] },
    ],
  },
  {
    slug: "exhaust", bn: "এক্সহস্ট / সাইলেন্সার", en: "Exhaust", icon: "exhaust",
    groups: [
      { slug: "exhaust-system", bn: "এক্সহস্ট", en: "Exhaust system", template: "GENERIC_PART",
        items: [["সাইলেন্সার", "Muffler", ["মাফলার"]], ["ক্যাটালিটিক কনভার্টার", "Catalytic converter"], ["সামনের পাইপ", "Front pipe"], ["ফ্লেক্সিবল জয়েন্ট", "Flexible joint"], ["EGR ভাল্ভ", "EGR valve"]] },
    ],
  },
  {
    slug: "transmission", bn: "গিয়ার ও এক্সেল", en: "Transmission & drivetrain", icon: "transmission",
    groups: [
      { slug: "gearbox", bn: "গিয়ারবক্স", en: "Gearbox", template: "TRANSMISSION", size: "large_heavy", restricted: true, video: true,
        items: [["অটো গিয়ারবক্স", "Automatic gearbox"], ["ম্যানুয়াল গিয়ারবক্স", "Manual gearbox"], ["CVT গিয়ারবক্স", "CVT gearbox"], ["ভাল্ভ বডি", "Valve body"], ["গিয়ারবক্স মাউন্ট", "Gearbox mount"]] },
      { slug: "clutch", bn: "ক্লাচ", en: "Clutch", template: "GENERIC_PART",
        items: [["ক্লাচ কিট", "Clutch kit"], ["ক্লাচ প্লেট", "Clutch plate"], ["প্রেসার প্লেট", "Pressure plate"], ["রিলিজ বেয়ারিং", "Release bearing"]] },
      { slug: "axle", bn: "এক্সেল ও শ্যাফট", en: "Axles & shafts", template: "GENERIC_PART", position: true,
        items: [["ড্রাইভ শ্যাফট", "Drive shaft", ["এক্সেল"]], ["CV জয়েন্ট", "CV joint"], ["CV বুট", "CV boot"], ["প্রপেলার শ্যাফট", "Propeller shaft"]] },
    ],
  },
  {
    slug: "brakes", bn: "ব্রেক", en: "Brakes", icon: "brake",
    groups: [
      { slug: "brake-parts", bn: "ব্রেকের যন্ত্রাংশ", en: "Brake parts", template: "BRAKE", position: true,
        items: [["ব্রেক প্যাড", "Brake pad", ["ব্রেক শু", "প্যাড"]], ["ব্রেক শু", "Brake shoe"], ["ডিস্ক রোটর", "Disc rotor"], ["ক্যালিপার", "Caliper"], ["ব্রেক মাস্টার সিলিন্ডার", "Brake master cylinder"], ["ABS সেন্সর", "ABS sensor"]] },
    ],
  },
  {
    slug: "suspension", bn: "সাসপেনশন", en: "Suspension", icon: "suspension",
    groups: [
      { slug: "suspension-parts", bn: "সাসপেনশনের যন্ত্রাংশ", en: "Suspension parts", template: "SUSPENSION", position: true,
        items: [["শক অ্যাবজর্বার", "Shock absorber", ["শকার", "শক"]], ["স্ট্রাট মাউন্ট", "Strut mount"], ["লোয়ার আর্ম", "Lower arm"], ["বল জয়েন্ট", "Ball joint"], ["স্ট্যাবিলাইজার লিংক", "Stabilizer link"], ["হুইল বেয়ারিং", "Wheel bearing"]] },
    ],
  },
  {
    slug: "steering", bn: "স্টিয়ারিং", en: "Steering", icon: "steering",
    groups: [
      { slug: "steering-parts", bn: "স্টিয়ারিংয়ের যন্ত্রাংশ", en: "Steering parts", template: "GENERIC_PART", position: true,
        items: [["স্টিয়ারিং র‍্যাক", "Steering rack"], ["পাওয়ার স্টিয়ারিং পাম্প", "Power steering pump"], ["টাই রড এন্ড", "Tie rod end"], ["র‍্যাক এন্ড", "Rack end"], ["ক্লক স্প্রিং", "Clock spring"]] },
    ],
  },
  {
    slug: "wheels-tyres", bn: "চাকা ও টায়ার", en: "Wheels & tyres", icon: "tyre",
    groups: [
      { slug: "tyres", bn: "টায়ার", en: "Tyres", template: "TYRE", size: "medium",
        items: [["টায়ার নতুন", "New tyre", ["চাকা"]], ["টায়ার জাপানি", "Used Japanese tyre"], ["টিউব", "Tube"]] },
      { slug: "rims", bn: "রিম", en: "Rims", template: "RIM", size: "medium",
        items: [["অ্যালয় রিম", "Alloy rim", ["এলয় হুইল"]], ["স্টিল রিম", "Steel rim"], ["হুইল ক্যাপ", "Wheel cap"]] },
    ],
  },
  {
    slug: "battery-charging", bn: "ব্যাটারি ও চার্জিং", en: "Battery & charging", icon: "battery",
    groups: [
      { slug: "battery", bn: "ব্যাটারি", en: "Battery", template: "BATTERY", size: "medium",
        items: [["ব্যাটারি", "Battery"], ["ব্যাটারি টার্মিনাল", "Battery terminal"]] },
      { slug: "rotating", bn: "ডায়নামো ও সেলফ", en: "Alternator & starter", template: "ROTATING_ELEC", electrical: true,
        items: [["ডায়নামো", "Alternator", ["অল্টারনেটর"]], ["সেলফ মোটর", "Starter motor", ["সেলফ", "স্টার্টার"]], ["ভোল্টেজ রেগুলেটর", "Voltage regulator"]] },
    ],
  },
  {
    slug: "electrical", bn: "ইলেকট্রিক্যাল", en: "Electrical", icon: "electrical",
    groups: [
      { slug: "modules", bn: "মডিউল ও কম্পিউটার", en: "Modules & ECUs", template: "ELECTRONIC_MODULE", electrical: true,
        items: [["ইঞ্জিন ECU", "Engine ECU", ["কম্পিউটার বক্স"]], ["গিয়ারবক্স TCM", "Gearbox TCM"], ["স্মার্ট কী", "Smart key", ["চাবি", "রিমোট"]]] },
      { slug: "switches-motors", bn: "সুইচ ও মোটর", en: "Switches & motors", template: "GENERIC_PART", position: true, electrical: true,
        items: [["উইন্ডো মোটর", "Window motor", ["গ্লাস মোটর"]], ["উইন্ডো সুইচ", "Window switch"], ["ওয়াইপার মোটর", "Wiper motor"], ["ব্লোয়ার মোটর", "Blower motor"], ["হর্ন", "Horn"]] },
      { slug: "fuses", bn: "ফিউজ ও রিলে", en: "Fuses & relays", template: "FUSE", size: "small", electrical: true,
        items: [["ফিউজ", "Fuse"], ["রিলে", "Relay"], ["ফিউজ বক্স", "Fuse box"]] },
    ],
  },
  {
    slug: "sensors", bn: "সেন্সর", en: "Sensors", icon: "sensor",
    groups: [
      { slug: "sensor-parts", bn: "সেন্সর", en: "Sensors", template: "ELECTRONIC_MODULE", size: "small", electrical: true,
        items: [["অক্সিজেন সেন্সর", "Oxygen sensor", ["O2 সেন্সর"]], ["ক্র্যাংক সেন্সর", "Crank sensor"], ["ক্যাম সেন্সর", "Cam sensor"], ["MAF সেন্সর", "MAF sensor"], ["পার্কিং সেন্সর", "Parking sensor"]] },
    ],
  },
  {
    slug: "lighting", bn: "লাইট", en: "Lighting", icon: "light",
    groups: [
      { slug: "lamps", bn: "লাইট সম্পূর্ণ", en: "Lamp assemblies", template: "LAMP_ASSY", position: true, electrical: true,
        items: [["হেডলাইট", "Headlight", ["হেডলাইট সেট", "বাতি"]], ["ফগ লাইট", "Fog light"], ["ব্যাকলাইট", "Tail light", ["টেইল লাইট", "পেছনের লাইট"]], ["ইন্ডিকেটর", "Indicator"], ["DRL", "DRL"]] },
      { slug: "bulbs", bn: "বাল্ব", en: "Bulbs", template: "BULB", size: "small", electrical: true,
        items: [["হেডলাইট বাল্ব", "Headlight bulb"], ["ইন্ডিকেটর বাল্ব", "Indicator bulb"], ["LED বাল্ব", "LED bulb"]] },
    ],
  },
  {
    slug: "body", bn: "বডি পার্টস", en: "Body exterior", icon: "body",
    groups: [
      { slug: "panels", bn: "প্যানেল", en: "Panels", template: "BODY_PANEL", position: true, size: "large_heavy",
        items: [["সামনের বাম্পার", "Front bumper", ["বাম্পার"]], ["পেছনের বাম্পার", "Rear bumper"], ["বনেট", "Bonnet", ["হুড"]], ["ফেন্ডার", "Fender", ["উইং"]], ["দরজা", "Door"], ["গ্রিল", "Grille"]] },
      { slug: "cuts", bn: "সম্পূর্ণ অংশ / কাট", en: "Cuts", template: "BODY_PANEL", size: "large_heavy",
        items: [["নোজ কাট", "Nose cut"], ["হাফকাট", "Half cut"], ["দরজা সম্পূর্ণ", "Complete door"]] },
      { slug: "mirrors", bn: "আয়না (লুকিং গ্লাস)", en: "Mirrors", template: "MIRROR", position: true,
        items: [["সাইড মিরর", "Side mirror", ["লুকিং গ্লাস"]], ["মিরর গ্লাস", "Mirror glass"], ["মিরর কভার", "Mirror cover"]] },
      { slug: "handles-locks", bn: "হ্যান্ডেল ও তালা", en: "Handles & locks", template: "GENERIC_PART", position: true, size: "small",
        items: [["দরজার হ্যান্ডেল", "Door handle"], ["বনেট লক", "Bonnet lock"], ["গ্যাস স্ট্রাট", "Gas strut"]] },
      { slug: "wipers", bn: "ওয়াইপার", en: "Wipers", template: "WIPER", size: "small",
        items: [["ওয়াইপার ব্লেড", "Wiper blade"], ["ওয়াইপার আর্ম", "Wiper arm"], ["ওয়াশার ট্যাংক", "Washer tank"]] },
    ],
  },
  {
    slug: "glass", bn: "গ্লাস", en: "Glass", icon: "glass",
    groups: [
      { slug: "glass-parts", bn: "গ্লাস", en: "Glass", template: "GLASS", position: true, size: "large_heavy",
        items: [["সামনের গ্লাস", "Windshield", ["উইন্ডশিল্ড"]], ["পেছনের গ্লাস", "Rear glass"], ["দরজার গ্লাস", "Door glass"]] },
    ],
  },
  {
    slug: "interior", bn: "ভেতরের অংশ", en: "Interior", icon: "interior",
    groups: [
      { slug: "interior-parts", bn: "ভেতরের যন্ত্রাংশ", en: "Interior parts", template: "INTERIOR", position: true,
        items: [["মিটার", "Instrument cluster", ["স্পিডোমিটার"]], ["স্টিয়ারিং হুইল", "Steering wheel"], ["সিট", "Seat"], ["এয়ারব্যাগ", "Airbag"], ["হেড ইউনিট", "Head unit", ["অডিও"]], ["এসি ভেন্ট", "AC vent"]] },
    ],
  },
  {
    slug: "ac", bn: "এসি", en: "AC", icon: "ac",
    groups: [
      { slug: "ac-parts", bn: "এসির যন্ত্রাংশ", en: "AC parts", template: "AC_PART",
        items: [["এসি কম্প্রেসর", "AC compressor"], ["কনডেন্সার", "Condenser"], ["কুলিং কয়েল", "Evaporator", ["ইভাপোরেটর"]], ["এক্সপানশন ভাল্ভ", "Expansion valve"], ["এসি গ্যাস", "AC gas"]] },
    ],
  },
  {
    slug: "service", bn: "ফিল্টার ও তেল", en: "Filters & fluids", icon: "filter",
    groups: [
      { slug: "filters", bn: "ফিল্টার", en: "Filters", template: "FILTER", size: "small",
        items: [["মবিল ফিল্টার", "Oil filter", ["অয়েল ফিল্টার"]], ["এয়ার ফিল্টার", "Air filter"], ["এসি ফিল্টার", "Cabin filter", ["কেবিন ফিল্টার"]], ["গিয়ার অয়েল ফিল্টার", "ATF filter"]] },
      { slug: "fluids", bn: "তেল ও তরল", en: "Oils & fluids", template: "FLUID", restricted: true,
        items: [["ইঞ্জিন অয়েল", "Engine oil", ["মবিল"]], ["ATF / CVT অয়েল", "ATF / CVT fluid"], ["ব্রেক অয়েল", "Brake fluid"], ["কুল্যান্ট", "Coolant"]] },
    ],
  },
  {
    slug: "belts", bn: "বেল্ট ও হোস", en: "Belts & hoses", icon: "belt",
    groups: [
      { slug: "belt-parts", bn: "বেল্ট", en: "Belts", template: "BELT", size: "small",
        items: [["ফ্যান বেল্ট", "Fan belt", ["ড্রাইভ বেল্ট"]], ["এসি বেল্ট", "AC belt"], ["বেল্ট টেনশনার", "Belt tensioner"]] },
    ],
  },
  {
    slug: "hardware", bn: "নাট-বল্টু ও ক্লিপ", en: "Hardware & clips", icon: "hardware",
    groups: [
      { slug: "hardware-parts", bn: "ছোট যন্ত্রাংশ", en: "Small hardware", template: "HARDWARE", size: "small",
        items: [["বাম্পার ক্লিপ", "Bumper clip"], ["চাকার নাট", "Wheel nut"], ["বল্টু", "Bolt"], ["হোস ক্ল্যাম্প", "Hose clamp"]] },
    ],
  },
  {
    slug: "hybrid", bn: "হাইব্রিড", en: "Hybrid & EV", icon: "hybrid",
    groups: [
      { slug: "hybrid-parts", bn: "হাইব্রিড যন্ত্রাংশ", en: "Hybrid parts", template: "HYBRID", electrical: true,
        items: [["হাইব্রিড ব্যাটারি", "Hybrid battery", ["হাইব্রিড ব্যাটারি প্যাক"]], ["হাইব্রিড সেল", "Hybrid cell"], ["ইনভার্টার", "Inverter"]] },
    ],
  },
  {
    slug: "accessories", bn: "অ্যাক্সেসরিজ", en: "Accessories", icon: "accessory",
    groups: [
      { slug: "accessory-items", bn: "অ্যাক্সেসরিজ", en: "Accessories", template: "ACCESSORY",
        items: [["সিট কভার", "Seat cover"], ["ফ্লোর ম্যাট", "Floor mat"], ["ড্যাশক্যাম", "Dashcam"], ["অ্যান্ড্রয়েড প্লেয়ার", "Android player"], ["রিভার্স ক্যামেরা", "Reverse camera"]] },
      { slug: "tools", bn: "টুলস ও জরুরি", en: "Tools & emergency", template: "ACCESSORY",
        items: [["জ্যাক", "Jack"], ["টায়ার ইনফ্লেটর", "Tyre inflator"], ["জাম্প স্টার্ট ক্যাবল", "Jump cable"], ["ফায়ার এক্সটিংগুইশার", "Fire extinguisher"]] },
    ],
  },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const build = (): Category[] => {
  const out: Category[] = [];
  for (const d of tree) {
    const did = `c-${d.slug}`;
    out.push({
      id: did, parent_id: null, level: 1, name: d.en, name_bn: d.bn, slug: d.slug, icon: d.icon,
      attribute_template: "GENERIC_PART", needs_position: false, default_size_class: "medium",
      is_electrical: false, is_restricted: false, min_photos: 2, requires_video: false, synonyms: [],
    });
    for (const gr of d.groups) {
      const gid = `c-${gr.slug}`;
      const common = {
        icon: d.icon,
        attribute_template: gr.template,
        needs_position: !!gr.position,
        default_size_class: gr.size ?? "medium",
        is_electrical: !!gr.electrical,
        is_restricted: !!gr.restricted,
        min_photos: gr.video ? 4 : 2,
        requires_video: !!gr.video,
      };
      out.push({ id: gid, parent_id: did, level: 2, name: gr.en, name_bn: gr.bn, slug: gr.slug, synonyms: [], ...common });
      for (const [bn, en, syn] of gr.items) {
        const slug = `${gr.slug}--${slugify(en)}`;
        out.push({ id: `c-${slug}`, parent_id: gid, level: 3, name: en, name_bn: bn, slug, synonyms: syn ?? [], ...common });
      }
    }
  }
  return out;
};

export const categories: Category[] = build();

// Attribute templates (file 04 section 6). Only the fields the upload flow asks
// up front; the rest live behind "more details (optional)".
const o = (pairs: [string, string, string][]) => pairs.map(([value, bn, en]) => ({ value, bn, en }));
const yesNo = o([["yes", "আছে", "Yes"], ["no", "নেই", "No"]]);

export const attributeDefinitions: AttributeDefinition[] = [
  { template: "ENGINE_ASSY", key: "engine_code", label_bn: "ইঞ্জিন কোড", label_en: "Engine code", input_type: "text", required: true },
  { template: "ENGINE_ASSY", key: "included", label_bn: "কতটুকু আছে", label_en: "What's included", input_type: "checklist", required: true,
    options: o([["ecu", "ECU", "ECU"], ["wiring", "ওয়্যারিং", "Wiring"], ["alternator", "ডায়নামো", "Alternator"], ["starter", "সেলফ", "Starter"], ["ac_comp", "এসি কম্প্রেসর", "AC compressor"], ["gearbox", "গিয়ারবক্স", "Gearbox"]]) },
  { template: "ENGINE_ASSY", key: "tested", label_bn: "চালু করে দেখা", label_en: "Run-tested", input_type: "chips", required: true,
    options: o([["video", "চালু ভিডিও আছে", "Running video"], ["not_tested", "টেস্ট করা হয়নি", "Not tested"]]) },
  { template: "ENGINE_ASSY", key: "km", label_bn: "কত কিমি চলেছে", label_en: "Mileage", input_type: "number", unit: "km", required: false },
  { template: "TRANSMISSION", key: "type", label_bn: "ধরন", label_en: "Type", input_type: "chips", required: true, options: o([["auto", "অটো", "Auto"], ["manual", "ম্যানুয়াল", "Manual"], ["cvt", "CVT", "CVT"]]) },
  { template: "TRANSMISSION", key: "drive", label_bn: "ড্রাইভ", label_en: "Drive", input_type: "chips", required: false, options: o([["2wd", "2WD", "2WD"], ["4wd", "4WD", "4WD"]]) },
  { template: "BRAKE", key: "sensor_wire", label_bn: "সেন্সর তার", label_en: "Sensor wire", input_type: "chips", required: false, options: yesNo },
  { template: "BRAKE", key: "material", label_bn: "উপাদান", label_en: "Material", input_type: "chips", required: false, options: o([["ceramic", "সিরামিক", "Ceramic"], ["semi_metallic", "সেমি-মেটালিক", "Semi-metallic"], ["unknown", "জানা নেই", "Unknown"]]) },
  { template: "SUSPENSION", key: "shock_type", label_bn: "ধরন", label_en: "Type", input_type: "chips", required: false, options: o([["gas", "গ্যাস", "Gas"], ["oil", "তেল", "Oil"]]) },
  { template: "SUSPENSION", key: "assembly", label_bn: "স্ট্রাট সম্পূর্ণ?", label_en: "Full strut?", input_type: "chips", required: false, options: o([["full", "সম্পূর্ণ", "Complete"], ["shock_only", "শুধু শক", "Shock only"]]) },
  { template: "TYRE", key: "width", label_bn: "প্রস্থ", label_en: "Width", input_type: "chips", required: true, options: o([["165", "165", "165"], ["175", "175", "175"], ["185", "185", "185"], ["195", "195", "195"], ["205", "205", "205"], ["215", "215", "215"], ["225", "225", "225"]]) },
  { template: "TYRE", key: "ratio", label_bn: "অনুপাত", label_en: "Ratio", input_type: "chips", required: true, options: o([["55", "55", "55"], ["60", "60", "60"], ["65", "65", "65"], ["70", "70", "70"]]) },
  { template: "TYRE", key: "rim", label_bn: "রিম", label_en: "Rim", input_type: "chips", required: true, options: o([["14", "14", "14"], ["15", "15", "15"], ["16", "16", "16"], ["17", "17", "17"], ["18", "18", "18"]]) },
  { template: "TYRE", key: "dot", label_bn: "তৈরির তারিখ (DOT)", label_en: "DOT date", input_type: "text", required: false },
  { template: "TYRE", key: "tread", label_bn: "গ্রিপ কতটুকু", label_en: "Tread left", input_type: "chips", required: false, options: o([["full", "পুরো", "Full"], ["half", "অর্ধেক", "Half"], ["low", "কম", "Low"]]) },
  { template: "RIM", key: "size", label_bn: "সাইজ (ইঞ্চি)", label_en: "Size (inch)", input_type: "chips", required: true, options: o([["14", "14", "14"], ["15", "15", "15"], ["16", "16", "16"], ["17", "17", "17"], ["18", "18", "18"]]) },
  { template: "RIM", key: "pcd", label_bn: "বোল্ট প্যাটার্ন", label_en: "Bolt pattern", input_type: "chips", required: false, options: o([["4x100", "4x100", "4x100"], ["5x100", "5x100", "5x100"], ["5x114.3", "5x114.3", "5x114.3"]]) },
  { template: "BATTERY", key: "size_code", label_bn: "সাইজ কোড", label_en: "Size code", input_type: "chips", required: true, options: o([["NS40ZL", "NS40ZL", "NS40ZL"], ["NS60", "NS60", "NS60"], ["55B24L", "55B24L", "55B24L"], ["80D26R", "80D26R", "80D26R"], ["N70", "N70", "N70"]]) },
  { template: "BATTERY", key: "terminal", label_bn: "টার্মিনাল দিক", label_en: "Terminal side", input_type: "chips", required: true, options: o([["L", "বাম (L)", "Left (L)"], ["R", "ডান (R)", "Right (R)"]]) },
  { template: "BATTERY", key: "type", label_bn: "ধরন", label_en: "Type", input_type: "chips", required: false, options: o([["wet", "পানি দিতে হয়", "Wet"], ["mf", "ড্রাই (MF)", "Maintenance free"], ["agm", "AGM/EFB", "AGM/EFB"]]) },
  { template: "BATTERY", key: "made_month", label_bn: "তৈরির মাস", label_en: "Made month", input_type: "text", required: true },
  { template: "ROTATING_ELEC", key: "amp", label_bn: "অ্যাম্পিয়ার", label_en: "Amps", input_type: "chips", required: false, options: o([["80", "80A", "80A"], ["100", "100A", "100A"], ["130", "130A", "130A"]]) },
  { template: "ELECTRONIC_MODULE", key: "part_number_photo", label_bn: "লেবেলের ছবি দেওয়া হয়েছে", label_en: "Label photo added", input_type: "chips", required: true, options: yesNo },
  { template: "ELECTRONIC_MODULE", key: "tested", label_bn: "টেস্ট করা", label_en: "Tested", input_type: "chips", required: false, options: yesNo },
  { template: "LAMP_ASSY", key: "tech", label_bn: "প্রযুক্তি", label_en: "Technology", input_type: "chips", required: false, options: o([["halogen", "হ্যালোজেন", "Halogen"], ["hid", "HID", "HID"], ["led", "LED", "LED"], ["projector", "প্রজেক্টর", "Projector"]]) },
  { template: "LAMP_ASSY", key: "defects", label_bn: "সমস্যা", label_en: "Defects", input_type: "multi_chips", required: false, options: o([["fog", "ভেতরে পানি জমে", "Moisture inside"], ["crack", "গ্লাসে ফাটল", "Cracked lens"], ["tab", "কান ভাঙা", "Broken tab"], ["none", "কোনো সমস্যা নেই", "No defects"]]) },
  { template: "BULB", key: "base", label_bn: "বেস টাইপ", label_en: "Base type", input_type: "chips", required: true, options: o([["H4", "H4", "H4"], ["H7", "H7", "H7"], ["H11", "H11", "H11"], ["HB3", "HB3", "HB3"], ["D4S", "D4S", "D4S"], ["T10", "T10", "T10"]]) },
  { template: "FUSE", key: "amp", label_bn: "অ্যাম্পিয়ার", label_en: "Amps", input_type: "chips", required: true, options: o([["10", "10A", "10A"], ["15", "15A", "15A"], ["20", "20A", "20A"], ["30", "30A", "30A"]]) },
  { template: "BODY_PANEL", key: "paint", label_bn: "রঙ", label_en: "Paint", input_type: "chips", required: false, options: o([["painted", "রং করা", "Painted"], ["primer", "প্রাইমার", "Primer"], ["raw", "কাঁচা", "Raw"]]) },
  { template: "BODY_PANEL", key: "damage", label_bn: "টোল/ফাটা", label_en: "Dents/cracks", input_type: "chips", required: false, options: yesNo },
  { template: "MIRROR", key: "features", label_bn: "যা আছে", label_en: "Features", input_type: "multi_chips", required: false, options: o([["fold", "মোটর ফোল্ডিং", "Power fold"], ["signal", "সিগন্যাল লাইট", "Signal"], ["camera", "ক্যামেরা", "Camera"]]) },
  { template: "GLASS", key: "extras", label_bn: "যা আছে", label_en: "Extras", input_type: "multi_chips", required: false, options: o([["sensor", "সেন্সর ব্র্যাকেট", "Sensor bracket"], ["heat", "হিটিং লাইন", "Heating lines"], ["tint", "টিন্ট", "Tint"]]) },
  { template: "INTERIOR", key: "material", label_bn: "উপাদান", label_en: "Material", input_type: "chips", required: false, options: o([["fabric", "কাপড়", "Fabric"], ["leather", "লেদার", "Leather"]]) },
  { template: "AC_PART", key: "gas", label_bn: "গ্যাসের ধরন", label_en: "Gas type", input_type: "chips", required: false, options: o([["r134a", "R134a", "R134a"], ["r1234yf", "R1234yf", "R1234yf"]]) },
  { template: "FILTER", key: "pack", label_bn: "প্যাক", label_en: "Pack", input_type: "chips", required: false, options: o([["1", "১টা", "1"], ["2", "২টা", "2"], ["5", "৫টা", "5"]]) },
  { template: "FLUID", key: "viscosity", label_bn: "ভিসকোসিটি", label_en: "Viscosity", input_type: "chips", required: true, options: o([["0W-20", "0W-20", "0W-20"], ["5W-30", "5W-30", "5W-30"], ["10W-30", "10W-30", "10W-30"], ["10W-40", "10W-40", "10W-40"], ["20W-50", "20W-50", "20W-50"]]) },
  { template: "FLUID", key: "litre", label_bn: "পরিমাণ (লিটার)", label_en: "Litres", input_type: "chips", required: true, options: o([["1", "১", "1"], ["4", "৪", "4"], ["5", "৫", "5"]]) },
  { template: "FLUID", key: "expiry", label_bn: "মেয়াদ শেষ", label_en: "Expiry", input_type: "date", required: true },
  { template: "BELT", key: "code", label_bn: "সাইজ (যেমন 4PK875)", label_en: "Size (e.g. 4PK875)", input_type: "text", required: false },
  { template: "WIPER", key: "length", label_bn: "দৈর্ঘ্য (ইঞ্চি)", label_en: "Length (inch)", input_type: "chips", required: true, options: o([["14", "14", "14"], ["16", "16", "16"], ["18", "18", "18"], ["22", "22", "22"], ["26", "26", "26"]]) },
  { template: "HARDWARE", key: "used_for", label_bn: "কোথায় লাগে", label_en: "Used for", input_type: "text", required: true },
  { template: "HARDWARE", key: "pack", label_bn: "প্যাক সাইজ", label_en: "Pack size", input_type: "chips", required: true, options: o([["1", "১", "1"], ["10", "১০", "10"], ["50", "৫০", "50"]]) },
  { template: "IGNITION", key: "plug_type", label_bn: "ধরন", label_en: "Type", input_type: "chips", required: false, options: o([["normal", "সাধারণ", "Normal"], ["platinum", "প্লাটিনাম", "Platinum"], ["iridium", "ইরিডিয়াম", "Iridium"]]) },
  { template: "GAS_KIT", key: "retest_date", label_bn: "রিটেস্টের তারিখ", label_en: "Retest date", input_type: "date", required: true },
  { template: "HYBRID", key: "cells", label_bn: "সেল/মডিউল সংখ্যা", label_en: "Cells/modules", input_type: "number", required: false },
  { template: "ACCESSORY", key: "universal", label_bn: "সব গাড়িতে?", label_en: "Universal?", input_type: "chips", required: false, options: yesNo },
];

// Platform rules from file 04 section 10.
export const prohibitedRules = [
  { bn: "পুরনো ব্রেক প্যাড/শু", en: "Used brake pads/shoes", rule_bn: "নিষিদ্ধ", rule_en: "Prohibited" },
  { bn: "ডিপ্লয় হওয়া এয়ারব্যাগ", en: "Deployed airbags", rule_bn: "নিষিদ্ধ", rule_en: "Prohibited" },
  { bn: "রিটেস্ট সনদ ছাড়া পুরনো CNG/LPG সিলিন্ডার", en: "Used gas cylinders without retest certificate", rule_bn: "নিষিদ্ধ", rule_en: "Prohibited" },
  { bn: "নম্বর প্লেট", en: "Number plates", rule_bn: "নিষিদ্ধ", rule_en: "Prohibited" },
  { bn: "মেয়াদোত্তীর্ণ তেল/তরল", en: "Expired oils/fluids", rule_bn: "নিষিদ্ধ", rule_en: "Prohibited" },
  { bn: "পুলিশ/সরকারি চিহ্ন, সাইরেন, হাইড্রলিক হর্ন", en: "Police/government marks, sirens, hydraulic horns", rule_bn: "নিষিদ্ধ", rule_en: "Prohibited" },
  { bn: "ইঞ্জিন/চেসিস নম্বরসহ অংশ", en: "Parts with engine/chassis numbers", rule_bn: "অ্যাডমিন যাচাই", rule_en: "Admin check" },
  { bn: "\"জেনুইন\" দাবি করা তেল/ফিল্টার", en: "\"Genuine\" oils/filters", rule_bn: "শুধু অনুমোদিত বিক্রেতা", rule_en: "Approved sellers only" },
];
