// Bangla legal policies (file 00 §5, §6.3–6.4, §9; Digital Commerce Guidelines 2021).
// Every number comes from `settings`; pass a digit formatter for Bangla digits.
import { settings } from "@/lib/mock/settings";

type T = { bn: string; en: string };
export interface Policy {
  slug: string;
  icon: string;
  title: T;
  summary: T;
  sections: { h: T; items: T[] }[];
}

export const policySlugs = ["returns", "refund", "warranty", "delivery", "buyer-protection", "privacy"] as const;

export const buildPolicies = (d: (n: number | string) => string): Policy[] => {
  const s = settings;
  return [
    {
      slug: "returns", icon: "↩️",
      title: { bn: "রিটার্ন নীতি", en: "Returns policy" },
      summary: { bn: `ভুল বা ভাঙা জিনিস সবসময় ফেরত। মন বদলালে ${d(s.return_window_days)} দিনের মধ্যে (ফেরতযোগ্য হলে)।`, en: `Wrong or broken items are always returnable. Change of mind within ${s.return_window_days} days (if returnable).` },
      sections: [
        {
          h: { bn: "কোন ক্ষেত্রে ফেরত দেওয়া যাবে", en: "When you can return" },
          items: [
            { bn: "ভুল জিনিস বা বিবরণের সাথে মেলে না (উৎস, অবস্থা, গ্রেড, ফিটমেন্ট ভুল): পুরো টাকা ফেরত বা বদল। আসা-যাওয়ার খরচ দোকানের।", en: "Wrong item or not as described (source, condition, grade, fitment): full refund or replacement. The shop pays shipping both ways." },
            { bn: `ভাঙা/ত্রুটিপূর্ণ অবস্থায় পৌঁছালে ${d(s.damage_claim_hours)} ঘণ্টার মধ্যে ছবি/ভিডিওসহ জানান: পুরো টাকা ফেরত বা বদল। খরচ দোকানের।`, en: `Arrived broken: report within ${s.damage_claim_hours} hours with photos/video for a full refund or replacement. The shop pays.` },
            { bn: `ভুল গাড়ি বেছেছিলেন বা মন বদলেছে: দোকানের লিস্টিং "ফেরতযোগ্য" হলে ${d(s.return_window_days)} দিনের মধ্যে, না লাগানো ও অক্ষত অবস্থায়। আসা-যাওয়ার খরচ আপনার।`, en: `Wrong car chosen / change of mind: if the listing is "returnable", within ${s.return_window_days} days, unfitted and intact. You pay shipping both ways.` },
            { bn: "ইলেকট্রিক্যাল/ইলেকট্রনিক পার্ট লাগানোর পর ফেরত হয় না, যদি না ত্রুটিপূর্ণ প্রমাণিত হয়।", en: "Electrical/electronic parts can't be returned once fitted, unless proven faulty." },
          ],
        },
        {
          h: { bn: "\"গাড়িতে লাগছে না\" কার দায়?", en: "\"Doesn't fit\": who is responsible?" },
          items: [
            { bn: "আপনি \"আমার গাড়ি\" ঠিকভাবে সেট করে কিনলে আর লিস্টিংয়ে ওই গাড়িতে ফিট লেখা থাকলে, কিন্তু না লাগলে: দোকানের দায়।", en: "If you set \"My car\" correctly and the listing said it fits, but it doesn't: the shop is responsible." },
            { bn: "গাড়ি সেট না করে বা ⚠️ সতর্কতা উপেক্ষা করে কিনলে: ক্রেতার দায়।", en: "If you bought without setting your car or ignored the ⚠️ warning: the buyer is responsible." },
          ],
        },
        {
          h: { bn: "কীভাবে ফেরত দেবেন", en: "How to return" },
          items: [
            { bn: "আমার কাজ → অর্ডার → \"সমস্যা জানান\" চাপুন, ছবি দিন।", en: "My stuff → order → \"Report a problem\", add photos." },
            { bn: `দোকান ${d(s.vendor_dispute_response_hours)} ঘণ্টার মধ্যে উত্তর দেবে। না দিলে বা আপনি সন্তুষ্ট না হলে গাড়িহাব সিদ্ধান্ত দেবে (${d(s.complaint_first_response_hours)} ঘণ্টায় প্রথম সাড়া)।`, en: `The shop replies within ${s.vendor_dispute_response_hours} hours. Otherwise GaariHub decides (first response within ${s.complaint_first_response_hours} hours).` },
          ],
        },
      ],
    },
    {
      slug: "refund", icon: "💸",
      title: { bn: "রিফান্ড নীতি", en: "Refund policy" },
      summary: { bn: `জিনিস দেওয়া সম্ভব না হলে ${d(s.refund_hours_unfulfillable)} ঘণ্টায় টাকা ফেরত।`, en: `If an order can't be supplied, refund within ${s.refund_hours_unfulfillable} hours.` },
      sections: [
        {
          h: { bn: "কখন টাকা ফেরত পাবেন", en: "When you get a refund" },
          items: [
            { bn: `দোকান অর্ডার নিতে না পারলে বা বাতিল করলে: ${d(s.handover_hours)} ঘণ্টার মধ্যে জানানো হবে, ${d(s.refund_hours_unfulfillable)} ঘণ্টার মধ্যে টাকা ফেরত।`, en: `If the shop can't fulfil or cancels: you're told within ${s.handover_hours} hours and refunded within ${s.refund_hours_unfulfillable} hours.` },
            { bn: `সময়মতো ডেলিভারি না হলে ${d(s.refund_days_late)} দিনের মধ্যে পুরো টাকা ফেরত।`, en: `Late delivery: full refund within ${s.refund_days_late} days.` },
            { bn: "দাবি (সমস্যা জানান) আপনার পক্ষে মীমাংসা হলে সিদ্ধান্ত অনুযায়ী পুরো বা আংশিক টাকা ফেরত।", en: "If a claim is decided in your favour: full or partial refund as decided." },
          ],
        },
        {
          h: { bn: "কীভাবে ফেরত যাবে", en: "How refunds are paid" },
          items: [
            { bn: "যে মাধ্যমে দিয়েছিলেন সেখানেই (bKash/Nagad/কার্ড)। ক্যাশ অন ডেলিভারি হলে আপনার bKash/Nagad নম্বরে।", en: "To the same method you paid with (bKash/Nagad/card). For cash on delivery, to your bKash/Nagad number." },
            { bn: `ম্যানুয়াল অগ্রিম সর্বোচ্চ ${d(s.manual_advance_max_percent)}% নেওয়া হয় (আইনি নিয়ম), তাই ঝুঁকি কম।`, en: `Manual advance is capped at ${s.manual_advance_max_percent}% (legal rule), so your risk is small.` },
          ],
        },
      ],
    },
    {
      slug: "warranty", icon: "🛡️",
      title: { bn: "ওয়ারেন্টি নীতি", en: "Warranty policy" },
      summary: { bn: "দোকানের দেওয়া ওয়ারেন্টি; সমস্যা হলে গাড়িহাব মধ্যস্থতা করবে।", en: "Warranty is given by the shop; GaariHub mediates disputes." },
      sections: [
        {
          h: { bn: "ওয়ারেন্টি কীভাবে কাজ করে", en: "How warranty works" },
          items: [
            { bn: "প্রতিটা পণ্য ও দামে ওয়ারেন্টির মেয়াদ লেখা থাকে (🛡️ ব্যাজ)। দোকান প্ল্যাটফর্মের ন্যূনতম নিয়মের চেয়ে ভালো দিতে পারে, খারাপ নয়।", en: "Every listing and quote shows its warranty (🛡️ badge). Shops may offer better than the platform minimum, never worse." },
            { bn: "ওয়ারেন্টি দাবি: পাঠানোর খরচ আপনার, ফেরত পাঠানোর খরচ দোকানের।", en: "Warranty claims: you ship it in, the shop pays to ship it back." },
            { bn: "অর্ডার পেজে \"ইনভয়েস\" থেকে ওয়ারেন্টি কার্ড দেখুন ও প্রিন্ট করুন।", en: "See and print your warranty card from \"Invoice\" on the order page." },
          ],
        },
      ],
    },
    {
      slug: "delivery", icon: "🚚",
      title: { bn: "ডেলিভারি নীতি", en: "Delivery policy" },
      summary: { bn: `একই শহরে ${d(s.delivery_days_same_city)} দিন, অন্য শহরে ${d(s.delivery_days_other)} দিনের মধ্যে।`, en: `Within ${s.delivery_days_same_city} days in the same city, ${s.delivery_days_other} days elsewhere.` },
      sections: [
        {
          h: { bn: "সময়সীমা", en: "Timelines" },
          items: [
            { bn: `দোকান ${d(s.vendor_accept_hours)} ঘণ্টার মধ্যে অর্ডার নিশ্চিত করবে, না করলে অর্ডার বাতিল ও টাকা ফেরত।`, en: `Shops confirm within ${s.vendor_accept_hours} hours, otherwise the order is cancelled and refunded.` },
            { bn: `পেমেন্ট নিশ্চিতের ${d(s.handover_hours)} ঘণ্টার মধ্যে কুরিয়ারে হস্তান্তর।`, en: `Handed to the courier within ${s.handover_hours} hours of payment.` },
            { bn: `ডেলিভারি: একই শহরে ${d(s.delivery_days_same_city)} দিন, অন্য শহরে ${d(s.delivery_days_other)} দিন।`, en: `Delivery: ${s.delivery_days_same_city} days same city, ${s.delivery_days_other} days other cities.` },
          ],
        },
        {
          h: { bn: "চার্জ ও পদ্ধতি", en: "Charges and methods" },
          items: [
            { bn: "প্রতিটা দোকান আলাদা প্যাকেট পাঠায়, তাই ডেলিভারি চার্জ প্রতি দোকানে। ৩টা দোকান = ৩টা প্যাকেট।", en: "Each shop sends its own parcel, so delivery is charged per shop. 3 shops = 3 parcels." },
            { bn: `ক্যাশ অন ডেলিভারি ৳ ${d(s.cod_limit)} পর্যন্ত। দোকান থেকে নিজে নিলে ৪ সংখ্যার পিকআপ কোড বলতে হবে।`, en: `Cash on delivery up to ৳${s.cod_limit}. For store pickup, tell the 4-digit pickup code.` },
            { bn: "Assured হলে পাঠানোর আগে আমাদের হাবে জিনিস যাচাই হয়।", en: "Assured items are checked at our hub before dispatch." },
          ],
        },
      ],
    },
    {
      slug: "buyer-protection", icon: "🔒",
      title: { bn: "ক্রেতা সুরক্ষা", en: "Buyer protection" },
      summary: { bn: "জিনিস ঠিক না হলে টাকা ফেরত: শুধু অ্যাপে পেমেন্ট করা অর্ডারে।", en: "Money back if the item isn't right: only for orders paid in the app." },
      sections: [
        {
          h: { bn: "টাকা কীভাবে নিরাপদ থাকে", en: "How your money is kept safe" },
          items: [
            { bn: "আপনার টাকা (অনলাইন বা ক্যাশ অন ডেলিভারি) প্রথমে গাড়িহাবের কাছে আসে।", en: "Your money (online or COD) comes to GaariHub first." },
            { bn: `জিনিস পৌঁছানোর পর ${d(s.return_window_days)} দিন কোনো সমস্যা না জানালে তবেই দোকান টাকা পায়।`, en: `The shop is paid only after ${s.return_window_days} days with no problem reported.` },
            { bn: "সমস্যা জানালে সমাধান না হওয়া পর্যন্ত টাকা আটকে থাকে।", en: "If you report a problem, money stays on hold until it's solved." },
          ],
        },
        {
          h: { bn: "যা করবেন না", en: "What not to do" },
          items: [
            { bn: "দোকানের নম্বরে সরাসরি টাকা পাঠাবেন না। অ্যাপের বাইরে কিনলে এই সুরক্ষা পাবেন না।", en: "Never send money directly to a shop's number. Buying outside the app loses this protection." },
            { bn: "কেউ বাইরে টাকা চাইলে চ্যাটে 🚩 রিপোর্ট করুন।", en: "If anyone asks you to pay outside, report them with 🚩 in chat." },
          ],
        },
      ],
    },
    {
      slug: "privacy", icon: "🕶️",
      title: { bn: "প্রাইভেসি নীতি", en: "Privacy policy" },
      summary: { bn: "দোকান আপনার নাম, নম্বর বা ঠিকানা দেখে না, শুধু এলাকা।", en: "Shops never see your name, number or address, only your area." },
      sections: [
        {
          h: { bn: "আমরা কী রাখি", en: "What we keep" },
          items: [
            { bn: "ফোন নম্বর (লগইন ও নোটিফিকেশন), ঠিকানা (ডেলিভারি), আপনার গাড়ির তথ্য (সঠিক পার্ট খুঁজতে)।", en: "Phone (login and notifications), addresses (delivery), car details (to find the right part)." },
            { bn: `ভয়েস নোট ${d(s.voice_retention_days)} দিন পর মুছে ফেলা হয়।`, en: `Voice notes are deleted after ${s.voice_retention_days} days.` },
          ],
        },
        {
          h: { bn: "কে কী দেখে", en: "Who sees what" },
          items: [
            { bn: "রিকোয়েস্টে দোকান শুধু জেলা/এলাকা দেখে। অর্ডার নিশ্চিত হলে ডেলিভারির জন্য ঠিকানা কুরিয়ার পায়।", en: "On requests, shops see only district/area. Couriers get the address after an order is confirmed." },
            { bn: "চ্যাটে ফোন নম্বর ও লিংক স্বয়ংক্রিয়ভাবে লুকানো হয়।", en: "Phone numbers and links are hidden automatically in chat." },
            { bn: "গাড়ির কাগজের ছবি কখনো পাবলিক হয় না।", en: "Car paper photos are never public." },
          ],
        },
      ],
    },
  ];
};
