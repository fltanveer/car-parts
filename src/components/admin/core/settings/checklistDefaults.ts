// Inspection checklist template seed (file 03 §18). Each point is rated
// green / yellow / red by the inspector, optionally with a photo.
export interface ChecklistPoint {
  id: string;
  bn: string;
  photo: boolean;
}
export interface ChecklistSection {
  id: string;
  bn: string;
  en: string;
  points: ChecklistPoint[];
}

const sec = (id: string, bn: string, en: string, pts: [string, boolean][]): ChecklistSection => ({
  id, bn, en, points: pts.map(([p, photo], i) => ({ id: `${id}-${i + 1}`, bn: p, photo })),
});

export const defaultChecklist = (): ChecklistSection[] => [
  sec("body", "বডি", "Body", [["রঙ মিল (রিপেইন্ট?)", true], ["ডেন্ট/স্ক্র্যাচ", true], ["মরিচা", true], ["প্যানেল গ্যাপ", false]]),
  sec("engine", "ইঞ্জিন", "Engine", [["স্টার্ট ও আইডল", false], ["তেল লিক", true], ["ধোঁয়া (রঙ)", true], ["অস্বাভাবিক শব্দ", false]]),
  sec("gear", "গিয়ার", "Transmission", [["গিয়ার বদল মসৃণ", false], ["ক্লাচ/ATF অবস্থা", false]]),
  sec("suspension", "সাসপেনশন", "Suspension", [["শক অ্যাবজর্বার", false], ["বুশ ও লিংক", true]]),
  sec("electrical", "ইলেকট্রিক্যাল", "Electrical", [["ব্যাটারি", false], ["লাইট সব জ্বলে", false], ["ড্যাশবোর্ড ওয়ার্নিং লাইট", true]]),
  sec("interior", "ভেতর", "Interior", [["সিট ও কভার", true], ["এসি ঠান্ডা", false], ["মিটার (কিমি) সঙ্গতি", true]]),
  sec("underbody", "নিচের অংশ", "Underbody", [["চেসিস ক্ষতি/ঝালাই", true], ["এক্সহস্ট", false]]),
  sec("test_drive", "টেস্ট ড্রাইভ", "Test drive", [["ব্রেক", false], ["স্টিয়ারিং সোজা চলে", false], ["কম্পন", false]]),
  sec("papers", "কাগজ", "Papers", [["রেজিস্ট্রেশন মিল (চেসিস/ইঞ্জিন নম্বর)", true], ["ট্যাক্স টোকেন", true], ["ফিটনেস", true]]),
];
