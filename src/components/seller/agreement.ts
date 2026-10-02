import { settings } from "@/lib/mock/settings";

const bnNum = (n: number) => String(n).replace(/[0-9]/g, (x) => "০১২৩৪৫৬৭৮৯"[Number(x)]);

/** Seller agreement in plain Bangla, 10 key points (file 02 §3 step 7, legal: file 00 §5). */
export const agreementPoints = (): { icon: string; bn: string; en: string }[] => [
  {
    icon: "💰",
    bn: `কমিশন: প্রতিটা বিক্রিতে ${bnNum(settings.default_commission_percent)}% (শুরুর অফারে ${bnNum(settings.promo_commission_percent)}%)। প্রতিটা অর্ডারে "আপনি পাবেন" লেখা থাকবে।`,
    en: `Commission: ${settings.default_commission_percent}% per sale (launch offer ${settings.promo_commission_percent}%). Every order shows "you get".`,
  },
  {
    icon: "📅",
    bn: `টাকা কবে: পণ্য পৌঁছানোর পর ${bnNum(settings.return_window_days)} দিন ফেরতের সময়। তারপর টাকা ওয়ালেটে, প্রতি রবিবার পেআউট।`,
    en: `Payment: after delivery there's a ${settings.return_window_days}-day return window, then money goes to your wallet; payouts every Sunday.`,
  },
  {
    icon: "⏱️",
    bn: `নতুন অর্ডার ${bnNum(settings.vendor_accept_hours)} ঘণ্টার মধ্যে গ্রহণ করতে হবে, পেমেন্টের ${bnNum(settings.handover_hours)} ঘণ্টার মধ্যে হস্তান্তর (আইন)।`,
    en: `Accept new orders within ${settings.vendor_accept_hours} hours; hand over within ${settings.handover_hours} hours of payment (law).`,
  },
  { icon: "💲", bn: "প্রতিটা পণ্যে দাম দিতে হবে। দাম দেওয়ার পর কাস্টমার নিলে সেই দামেই দিতে হবে।", en: "Every product needs a price. Once a customer accepts, you must sell at that price." },
  { icon: "📷", bn: "নিজের তোলা আসল ছবি দিন। উৎস, অবস্থা, গ্রেড সঠিক লিখুন।", en: "Use your own real photos. State source, condition and grade honestly." },
  {
    icon: "↩️",
    bn: `ভুল বা ভাঙা জিনিস গেলে কাস্টমার টাকা ফেরত বা বদল পাবে, খরচ দোকানের। সমস্যার উত্তর ${bnNum(settings.vendor_dispute_response_hours)} ঘণ্টার মধ্যে দিন।`,
    en: `Wrong or damaged items: the customer gets a refund or replacement at your cost. Reply to claims within ${settings.vendor_dispute_response_hours} hours.`,
  },
  { icon: "⚠️", bn: "ভুল তথ্য দিলে স্কোর কাটা যাবে, বারবার হলে দোকান স্থগিত।", en: "False information lowers your score; repeated cases suspend the shop." },
  { icon: "⛔", bn: "নিষিদ্ধ: পুরনো ব্রেক প্যাড, ডিপ্লয় হওয়া এয়ারব্যাগ, নম্বর প্লেট, মেয়াদোত্তীর্ণ তেল, সনদ ছাড়া পুরনো গ্যাস সিলিন্ডার, সাইরেন।", en: "Prohibited: used brake pads, deployed airbags, number plates, expired oil, uncertified used gas cylinders, sirens." },
  { icon: "📵", bn: "কাস্টমারকে ফোন নম্বর দেওয়া বা অ্যাপের বাইরে লেনদেন করা যাবে না।", en: "Don't share phone numbers or deal outside the app." },
  { icon: "🔒", bn: "আপনার NID ও কাগজ শুধু যাচাইয়ের জন্য, কারো সাথে শেয়ার হবে না।", en: "Your NID and papers are only used for verification and never shared." },
];
