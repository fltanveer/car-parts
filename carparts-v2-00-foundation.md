# GaariHub (অস্থায়ী নাম) v2: ফাইল ০০, ভিত্তি (মডেল, নিয়ম, ডাটাবেস)

> **এই ফাইলটা আগে পড়ুন।** বাকি ফাইলগুলো এর উপর দাঁড়িয়ে:
> - `carparts-v2-01-user-plan.md`: কাস্টমারের অ্যাপ/সাইট
> - `carparts-v2-02-vendor-plan.md`: বিক্রেতার প্যানেল
> - `carparts-v2-03-admin-plan.md`: অ্যাডমিন প্যানেল
> - `carparts-v2-04-parts-taxonomy.md`: পার্টসের ক্যাটাগরি, অ্যাট্রিবিউট, আপলোড নিয়ম
>
> v1 (একক বিক্রেতা, নিজস্ব গুদাম) ফাইলগুলো এই সেট দিয়ে বাতিল।

---

## ১. ভিশন: গাড়ির সব কিছু এক অ্যাপে

বাংলাদেশে গাড়ির মালিক, ড্রাইভার আর মেকানিকদের প্রতিটা কাজের জন্য আলাদা জায়গায় দৌড়াতে হয়: পার্টসের জন্য ধোলাইখাল, গাড়ি কেনাবেচার জন্য ফেসবুক/ক্লাসিফায়েড, সার্ভিসের জন্য পরিচিত গ্যারেজ, কাগজের জন্য দালাল। প্রতিটা জায়গায় ঠকার ভয়।

**GaariHub = গাড়ির ওয়ান-স্টপ সমাধান, যেখানে সবকিছু যাচাইকৃত, দাম স্বচ্ছ, আর ব্যবহার এত সহজ যে পড়তে না জানা মানুষও পারবে।**

### ১.১ মডিউল ও ফেজ

একসাথে সব চালু করলে কোনোটাই ভালো হবে না। তাই "ওয়ান-স্টপ" ধাপে ধাপে:

| মডিউল | কী | ফেজ |
|---|---|---|
| 🔧 **পার্টস মার্কেটপ্লেস** | অনেক বিক্রেতা, দাম তুলনা, অর্ডার, ডেলিভারি | ১ |
| 🙋 **পার্ট চাই (দরদাম)** | কাস্টমার রিকোয়েস্ট দেয়, বিক্রেতারা দাম দেয়, কাস্টমার তুলনা করে বেছে নেয় | ১ |
| 🚗 **আমার গাড়ি** | গাড়ির প্রোফাইল, কাগজের মেয়াদ রিমাইন্ডার, সার্ভিস ও খরচের হিসাব | ১ |
| 🏪 **বিক্রেতা প্যানেল** | পণ্য আপলোড, অর্ডার, দরদাম, টাকা | ১ |
| 🚙 **গাড়ি কেনাবেচা** | ব্যক্তি ও ডিলারের গাড়ির বিজ্ঞাপন, যাচাই ব্যাজ, ইন্সপেকশন | ২ |
| 🧰 **মেকানিক ও গ্যারেজ** | যাচাইকৃত গ্যারেজ খোঁজা, বুকিং, পার্টস কিনে ফিটিং বুকিং | ২ |
| 🔍 **গাড়ি ইন্সপেকশন** | কেনার আগে বা বিক্রির জন্য চেক রিপোর্ট | ২ |
| 🛟 **রাস্তায় সাহায্য** | টোয়িং, ব্যাটারি জাম্প, টায়ার বদল, তেল শেষ | ৩ |
| 🧽 **সার্ভিস প্যাকেজ** | কার ওয়াশ, অয়েল চেঞ্জ, এসি সার্ভিস, বাসায় এসে সার্ভিস | ৩ |
| 📄 **কাগজপত্র সহায়তা** | ট্যাক্স টোকেন, ফিটনেস নবায়ন, মালিকানা বদল (পার্টনার এজেন্ট দিয়ে) | ৩ |
| 🛡️ **ইন্স্যুরেন্স ও ফাইন্যান্স** | পার্টনার কোম্পানির মাধ্যমে | ৩ |
| 🚘 **ড্রাইভার/রেন্ট-এ-কার** | পার্টনার মাধ্যমে | ৪ (পরে বিবেচনা) |

**কেন পার্টস দিয়ে শুরু:** এটাই সবচেয়ে ঘন ঘন দরকার, ঠকার ভয় সবচেয়ে বেশি, আর একবার বিশ্বাস জন্মালে বাকি সেবা (মেকানিক, গাড়ি কেনাবেচা) সহজে যোগ করা যায়। "আমার গাড়ি" প্রোফাইলটা সব মডিউলকে জোড়া দেয়: গাড়ি জানা থাকলে পার্টস, সার্ভিস, রিমাইন্ডার সবকিছু ব্যক্তিগত হয়ে যায়।

**প্রতিযোগিতা:** গাড়ি কেনাবেচার জন্য বাংলাদেশে GarirBazar (জুন ২০২৬-এ ৫২,০০০+ বিজ্ঞাপন), Bikroy, Carniba (২০০-পয়েন্ট ইন্সপেকশন) ইতিমধ্যে আছে। তাই গাড়ি কেনাবেচায় আমাদের পার্থক্য হবে: যাচাইকৃত কাগজ + ইন্সপেকশন + কেনার পর একই অ্যাপে পার্টস, সার্ভিস ও কাগজের রিমাইন্ডার। শুধু বিজ্ঞাপনের সাইট হলে জিততে পারবো না।

---

## ২. সহজ ব্যবহারের নীতি (সব প্যানেলে প্রযোজ্য, এটাই মূল নিয়ম)

ইউজার আর বিক্রেতা দুই পক্ষেরই বড় অংশ কম শিক্ষিত। প্রতিটা স্ক্রিন ডিজাইনের সময় এই ১২টা নিয়ম মেনে চলতে হবে:

1. **এক স্ক্রিনে এক কাজ।** একটাই প্রধান বড় বাটন।
2. **৩ ট্যাপ নিয়ম।** হোম থেকে যেকোনো মূল কাজ শুরু করতে সর্বোচ্চ ৩ ট্যাপ।
3. **টাইপ করানো শেষ উপায়।** আগে: বাছাই (আইকন/ছবি), ভয়েস, ক্যামেরা। টাইপ শুধু যেখানে অন্য উপায় নেই।
4. **ছবি + আইকন + লেখা একসাথে।** শুধু লেখা কখনো না।
5. **🔊 সব জায়গায় শোনার বাটন।** প্রতিটা স্ক্রিনের নির্দেশনা, প্রতিটা দাম/কোটেশন জোরে পড়ে শোনানো (বাংলা TTS বা প্রি-রেকর্ডেড)।
6. **🎤 সব জায়গায় বলার বাটন।** সার্চ, রিকোয়েস্ট, চ্যাট, বিবরণ, ঠিকানা, সব।
7. **মানুষ সবসময় এক ট্যাপ দূরে।** প্রতিটা স্ক্রিনে "সাহায্য লাগবে? কল করুন"। প্রযুক্তি না পারলে মানুষ সামলাবে।
8. **যা দরকার শুধু তখনই চাওয়া।** লগইন, নাম, ঠিকানা আগে থেকে চাওয়া নয়; যখন সত্যিই লাগবে তখন।
9. **ভুল করলে সহজে ফেরা।** বড় "পেছনে" বাটন, ড্রাফট অটো-সেভ, "পূর্বাবস্থায় ফেরান"।
10. **রঙ ও আইকনের অর্থ স্থির।** সবুজ = ঠিক/নিরাপদ, লাল = সমস্যা/বাতিল, হলুদ = অপেক্ষা। পুরো অ্যাপে একই।
11. **সস্তা ফোন ও ধীর নেটে চলবে।** ২ জিবি র‍্যামের অ্যান্ড্রয়েড, 3G-তে প্রথম স্ক্রিন ৩ সেকেন্ডের কম।
12. **বড় লেখা ও বাংলা সংখ্যা অপশন।** সেটিংসে "বড় লেখা" টগল।

**যাচাই পদ্ধতি:** প্রতিটা ফেজ চালুর আগে বাস্তব ইউজার দিয়ে পরীক্ষা: ধোলাইখালের ৫ জন বিক্রেতা, ৫ জন ড্রাইভার, ৫ জন গাড়ির মালিক। লক্ষ্য: কোনো সাহায্য ছাড়া একজন ড্রাইভার ২ মিনিটে ভয়েস রিকোয়েস্ট দিতে পারবে, একজন বিক্রেতা ৩ মিনিটে প্রথম পণ্য আপলোড করতে পারবে।

---

## ৩. প্ল্যাটফর্মে কারা থাকবে

### ৩.১ ভূমিকা (Roles)

একজন মানুষের একাধিক ভূমিকা থাকতে পারে (যেমন একটা গ্যারেজ পার্টস কেনে, আবার সার্ভিসও বিক্রি করে)। এক ফোন নম্বর = এক অ্যাকাউন্ট, ভূমিকা যোগ হয়।

| ভূমিকা | কী করে |
|---|---|
| ক্রেতা / গাড়ির মালিক | পার্টস কেনে, রিকোয়েস্ট দেয়, গাড়ি কেনে/বেচে, সার্ভিস নেয় |
| ড্রাইভার | মালিকের হয়ে পার্টস খোঁজে/কেনে (মালিকের গাড়ি শেয়ার করা যাবে) |
| বিক্রেতা (Vendor) | পার্টস/পণ্য বিক্রি, রিকোয়েস্টে দাম দেয় |
| গাড়ি বিক্রেতা (ব্যক্তি) | নিজের গাড়ির বিজ্ঞাপন |
| ডিলার | অনেক গাড়ির বিজ্ঞাপন (বিক্রেতা প্যানেলের "গাড়ি" অংশ) |
| মেকানিক / গ্যারেজ | সার্ভিস বুকিং নেয় (ফেজ ২), পার্টস কেনে (বিশেষ দাম পেতে পারে) |
| সার্ভিস প্রোভাইডার | ওয়াশ, টোয়িং, ইন্সপেকশন, কাগজপত্র (ফেজ ২/৩) |
| অ্যাডমিন স্টাফ | প্ল্যাটফর্ম পরিচালনা |

### ৩.২ বিক্রেতার ধরন

| ধরন | উদাহরণ | বিশেষ ফিচার |
|---|---|---|
| নতুন পার্টসের দোকান | জেনুইন/ব্র্যান্ডেড পার্টস | "আমার কাছেও আছে" দিয়ে দ্রুত লিস্টিং |
| রিকন্ডিশন/পুরনো পার্টসের দোকান | ধোলাইখালের জাপানি খোলা মাল | প্রতিটা আইটেম আলাদা, গ্রেড |
| হাফকাট/ভাঙারি | পুরো গাড়ি খুলে বিক্রি | "এই গাড়ি থেকে যা যা আছে" (একটা দাতা গাড়ির সব অংশ একসাথে) |
| টায়ার ও ব্যাটারি দোকান | | স্পেক-ভিত্তিক লিস্টিং, ফিটিং সেবা |
| তেল/লুব্রিকেন্ট ডিলার | | ব্যাচ/মেয়াদ, জেনুইন যাচাই |
| অ্যাক্সেসরিজ দোকান | | ভ্যারিয়েন্ট (রঙ/সাইজ) |
| গাড়ির ডিলার/শোরুম | রিকন্ডিশন গাড়ি | গাড়ির বিজ্ঞাপন (ফেজ ২) |
| প্ল্যাটফর্মের নিজস্ব স্টোর | GaariHub Store | নিজস্ব স্টকের পণ্য; বাকি বিক্রেতাদের মতোই নিয়মে চলবে |

---

## ৪. ব্যবসায়িক মডেল (আয়ের উৎস)

| উৎস | বিবরণ | কখন |
|---|---|---|
| কমিশন | প্ল্যাটফর্মে সম্পন্ন অর্ডারে ক্যাটাগরি অনুযায়ী ৩% থেকে ১০% | ফেজ ১ (শুরুর ৩ মাস ০% রাখার সুপারিশ, বিক্রেতা আনার জন্য) |
| বিক্রেতা সাবস্ক্রিপশন | ফ্রি / বেসিক / প্রো: লিস্টিং সংখ্যা, ব্যাজ, রিপোর্ট, অগ্রাধিকার | ফেজ ২ |
| প্রচার (Boost) | পণ্য বা দোকান সার্চে উপরে দেখানো | ফেজ ২ |
| ডেলিভারি মার্জিন | কুরিয়ারের সাথে চুক্তির দাম আর কাস্টমারের চার্জের পার্থক্য | ফেজ ১ |
| "Assured" QC ফি | হাবে যাচাই করে পাঠানোর সেবা | ফেজ ১/২ |
| গাড়ির বিজ্ঞাপন | ব্যক্তির প্রথম বিজ্ঞাপন ফ্রি, ডিলারের সাবস্ক্রিপশন, প্রচারিত বিজ্ঞাপন | ফেজ ২ |
| ইন্সপেকশন | প্রতিটা ইন্সপেকশনের ফি | ফেজ ২ |
| সার্ভিস বুকিং কমিশন | গ্যারেজ/ওয়াশ/টোয়িং | ফেজ ২/৩ |
| পার্টনার রেফারেল | ইন্স্যুরেন্স, লোন | ফেজ ৩ |
| বিজ্ঞাপন | তেল/টায়ার ব্র্যান্ডের স্পন্সর | ফেজ ৩ |

**গুরুত্বপূর্ণ:** কমিশন আছে বলে বিক্রেতারা কাস্টমারকে প্ল্যাটফর্মের বাইরে নিয়ে যেতে চাইবে। ঠেকানোর উপায় সেকশন ৬.৩-এ।

---

## ৫. আইনি বাধ্যবাধকতা (ডিজিটাল কমার্স পরিচালনা নির্দেশিকা ২০২১)

রিসার্চে পাওয়া মূল নিয়ম, যা সিস্টেমের ডিজাইনে সরাসরি প্রভাব ফেলে। **চালুর আগে একজন আইনজীবীর সাথে যাচাই করে নিন।**

| নিয়ম | আমাদের সিস্টেমে প্রয়োগ |
|---|---|
| রিফান্ড, রিটার্ন, রিপ্লেসমেন্ট, ডেলিভারি পদ্ধতি ও সময় বাংলায় পরিষ্কার লিখতে হবে | সব পলিসি পেজ ও প্রতিটা পণ্যে বাংলায় দেখানো |
| পূর্ণ পেমেন্টের ৪৮ ঘণ্টার মধ্যে পণ্য ডেলিভারিম্যানকে হস্তান্তর ও ক্রেতাকে জানানো | বিক্রেতার "পাঠানোর সময়সীমা" টাইমার, দেরি হলে সতর্কতা ও শাস্তি |
| একই শহরে ৫ দিন, অন্য শহরে ১০ দিনের মধ্যে ডেলিভারি | অর্ডারে সর্বোচ্চ ডেলিভারি তারিখ, পার হলে স্বয়ংক্রিয় এসকেলেশন |
| ৪৮ ঘণ্টায় পাঠানোর মতো স্টকে না থাকলে ১০% এর বেশি অগ্রিম নেওয়া যাবে না, যদি না বাংলাদেশ ব্যাংক অনুমোদিত এসক্রো সার্ভিস ব্যবহার হয় | **v1-এর ৩০ থেকে ৫০% অগ্রিম নিয়ম বাতিল।** অগ্রিম নেওয়া হবে শুধু পেমেন্ট গেটওয়ের এসক্রো দিয়ে; ম্যানুয়াল bKash/Nagad Send Money দিয়ে সর্বোচ্চ ১০% |
| দেরিতে ডেলিভারিতে ১০ দিনের মধ্যে পূর্ণ রিফান্ড; সরবরাহ সম্ভব না হলে ৪৮ ঘণ্টায় জানিয়ে ৭২ ঘণ্টায় রিফান্ড | রিফান্ড টাইমার ও অটো-রিফান্ড ফ্লো |
| অভিযোগ গ্রহণের ব্যবস্থা ও দায়িত্বপ্রাপ্ত কর্মকর্তা | অ্যাডমিনে অভিযোগ মডিউল, ৭২ ঘণ্টায় প্রথম সাড়া |
| মার্কেটপ্লেস ও বিক্রেতার মধ্যে চুক্তি থাকতে হবে | বিক্রেতা অনবোর্ডিংয়ে ডিজিটাল চুক্তি গ্রহণ (বাংলায়, অডিও ব্যাখ্যাসহ) |
| দাম লুকানো ("ইনবক্সে দাম") স্বচ্ছতার পরিপন্থী | **প্রতিটা লিস্টিংয়ে দাম বাধ্যতামূলক।** "দাম জানতে কল করুন" লিস্টিং নয়; দাম জানা না থাকলে সেটা "পার্ট চাই" রিকোয়েস্ট |

গাড়ি কেনাবেচা মডিউলে আমরা শুরুতে টাকা লেনদেন করবো না (শুধু বিজ্ঞাপন ও যোগাযোগ), তাই উপরের ডেলিভারি নিয়ম সেখানে সরাসরি প্রযোজ্য হবে না; তবে বিজ্ঞাপনেও দাম বাধ্যতামূলক ("আলোচনা সাপেক্ষ" চিহ্ন দেওয়া যাবে)।

---

## ৬. বিশ্বাস ও নিরাপত্তা ব্যবস্থা

মার্কেটপ্লেস হওয়ায় সেই প্রতারকরাই প্ল্যাটফর্মে আসতে পারে যাদের থেকে বাঁচানোই আমাদের লক্ষ্য। তাই এটাই প্রোডাক্টের কেন্দ্র।

### ৬.১ বিক্রেতা যাচাইয়ের স্তর

| স্তর | কী লাগে | কী পায় |
|---|---|---|
| ০. নতুন | ফোন OTP | পণ্য ড্রাফট করতে পারে, প্রকাশ নয় |
| ১. পরিচয় যাচাই | NID ছবি (দুই পাশ) + সেলফি | ২০টা পর্যন্ত পণ্য প্রকাশ, শুধু COD/এসক্রো অর্ডার |
| ২. দোকান যাচাই | ট্রেড লাইসেন্স + দোকানের ছবি + ম্যাপে লোকেশন + টিমের ফোন কল | সীমাহীন পণ্য, রিকোয়েস্টে দাম দেওয়া, ✅ "যাচাইকৃত দোকান" ব্যাজ |
| ৩. সরেজমিনে যাচাই | টিমের দোকান পরিদর্শন, ব্যাংক/bKash মার্চেন্ট তথ্য | 🏅 "বিশ্বস্ত বিক্রেতা" ব্যাজ, দ্রুত পেআউট, সার্চে অগ্রাধিকার |

### ৬.২ বিক্রেতা স্কোর (০ থেকে ১০০, কাস্টমার তারকা হিসেবে দেখে)

| উপাদান | ওজন |
|---|---|
| কাস্টমার রেটিং (গড়) | ৩০% |
| "যেমন বলা হয়েছিল তেমন না" দাবির হার (কম = ভালো) | ২০% |
| সময়মতো পাঠানোর হার | ১৫% |
| অর্ডার বাতিলের হার (বিক্রেতার দিক থেকে) | ১৫% |
| রিকোয়েস্টে সাড়ার গতি | ১০% |
| যাচাইয়ের স্তর | ১০% |

স্কোর ৫০-এর নিচে নামলে সতর্কতা, ৩০-এর নিচে স্থগিত (অ্যাডমিন পর্যালোচনা)।

### ৬.৩ প্ল্যাটফর্মের বাইরে লেনদেন ঠেকানো

- বিক্রেতার ফোন নম্বর কাস্টমারকে দেখানো হবে না; যোগাযোগ শুধু অ্যাপের চ্যাট ও **মাস্কড কল** (ফেজ ২, শুরুতে প্ল্যাটফর্মের মাধ্যমে কল ফরোয়ার্ড বা কলব্যাক অনুরোধ)
- দোকানের এলাকা ও বাজার (যেমন "ধোলাইখাল") দেখাবে; সঠিক ঠিকানা শুধু অর্ডার নিশ্চিতের পর "দোকান থেকে সংগ্রহ" বাছাই করলে
- চ্যাটে ফোন নম্বর, WhatsApp লিংক শেয়ার স্বয়ংক্রিয়ভাবে লুকানো (সতর্কবার্তাসহ: "প্ল্যাটফর্মের বাইরে কিনলে ক্রেতা সুরক্ষা পাবেন না")
- **ক্রেতা সুরক্ষা** (টাকা ফেরতের গ্যারান্টি) শুধু অ্যাপে পেমেন্ট করা অর্ডারে: এটাই কাস্টমারকে অ্যাপে রাখার সবচেয়ে বড় কারণ
- বিক্রেতার জন্য প্রণোদনা: অ্যাপে বিক্রি = স্কোর বাড়ে, রিভিউ জমে, বেশি কাস্টমার। কমিশন কম রাখা।

### ৬.৪ এসক্রো ও ক্রেতা সুরক্ষা

কাস্টমারের টাকা (অনলাইন বা COD যা-ই হোক) আগে প্ল্যাটফর্মের কাছে আসে, তারপর:
1. পণ্য ডেলিভারি হয়
2. **রিটার্ন উইন্ডো** (ডিফল্ট ৩ দিন) পার হয়, কোনো দাবি না থাকলে
3. কমিশন কেটে বিক্রেতার ওয়ালেটে যায়
4. সাপ্তাহিক (বা যাচাই স্তর ৩ হলে দৈনিক) পেআউট bKash/Nagad/ব্যাংকে

দাবি থাকলে টাকা আটকে থাকে সমাধান পর্যন্ত।

### ৬.৫ "GaariHub Assured" (ঐচ্ছিক QC হাব সেবা)

বিক্রেতা চাইলে পণ্য প্ল্যাটফর্মের হাবে পাঠাবে (বা রাইডার তুলে আনবে), টিম যাচাই করে (ছবি, পার্ট নম্বর, অবস্থা, গ্রেড মেলানো) প্যাক করে পাঠাবে। এসব পণ্যে ✔️ "Assured" ব্যাজ। কাস্টমার এটা ফিল্টার করতে পারবে। বেশি দামের পার্ট (ইঞ্জিন, গিয়ারবক্স, ECU, হেডলাইট) এই পথে পাঠাতে উৎসাহ দেওয়া।

---

## ৭. পার্ট চাই: রিকোয়েস্ট ও দরদাম (Reverse Marketplace)

### ৭.১ প্রবাহ
1. কাস্টমার রিকোয়েস্ট দেয় (ভয়েস/ছবি/লেখা + গাড়ি)
2. ভয়েস/ছবি বোঝা না গেলে প্ল্যাটফর্মের টিম শুনে **রিকোয়েস্ট পরিষ্কার করে** (ক্যাটাগরি, গাড়ি, পার্টের নাম)। পরিষ্কার লেখা রিকোয়েস্ট সরাসরি যায়।
3. রিকোয়েস্ট পাঠানো হয় **মিলে যাওয়া বিক্রেতাদের** কাছে (ক্যাটাগরি + গাড়ির ব্র্যান্ড + বিক্রেতার বিশেষত্ব + এলাকা)। ব্যক্তিগত তথ্য (নাম, নম্বর, ঠিকানা) বিক্রেতা দেখবে না, শুধু এলাকা/জেলা।
4. বিক্রেতারা **দাম দেয় (Quote)**: ছবি (নিজের স্টকের আসল ছবি), উৎস, অবস্থা, গ্রেড, দাম, ওয়ারেন্টি, কবে পাঠাতে পারবে
5. কাস্টমার সব দাম **তুলনা করে** একটা বেছে নেয় (বা একাধিক পার্টের জন্য একাধিক)
6. গ্রহণ → অর্ডার তৈরি, অন্য বিক্রেতাদের জানানো "অন্য একজন নির্বাচিত হয়েছেন"

### ৭.২ নিয়ম
- রিকোয়েস্টের মেয়াদ: ৭২ ঘণ্টা (কাস্টমার বাড়াতে পারবে)
- প্রতি রিকোয়েস্টে সর্বোচ্চ ১০টা কোট গ্রহণ; কাস্টমার প্রথমে "সেরা ৩টা" দেখবে, "আরও দেখুন" দিয়ে বাকি
- কোটের দাম **বাঁধা**: কাস্টমার গ্রহণের পর বিক্রেতা দাম বাড়াতে পারবে না। বাড়ালে বা "স্টক নেই" বললে স্কোর কাটা যাবে।
- কোটের ছবি বিক্রেতার নিজের তোলা হতে হবে (ইন্টারনেটের ছবি নয়); ডুপ্লিকেট ছবি শনাক্ত হলে ফ্ল্যাগ
- কোট দেওয়ার আগে বিক্রেতা প্রশ্ন করতে পারবে ("কোন ইঞ্জিন? ছবি আছে?"), প্রশ্ন-উত্তর কাস্টমার ও সব বিক্রেতা দেখবে (প্রাইভেট তথ্য ছাড়া)
- প্রতারণামূলক কম দাম (দাম কম দেখিয়ে পরে বাড়ানো) ঠেকাতে: বাজারদরের চেয়ে অস্বাভাবিক কম দামে "দাম যাচাই করুন" সতর্কতা কাস্টমার ও অ্যাডমিন দুই দিকেই

### ৭.৩ "সেরা পছন্দ" স্কোর (তুলনায় ডিফল্ট সাজানো)

`quote_score = দাম (৩৫%) + বিক্রেতা স্কোর (৩০%) + উৎস/অবস্থা/গ্রেড (১৫%) + ডেলিভারির গতি (১০%) + ওয়ারেন্টি (৫%) + দূরত্ব (৫%)`

অন্য সাজানো: সবচেয়ে কম দাম, সবচেয়ে দ্রুত, সবচেয়ে কাছে, শুধু জেনুইন, শুধু Assured।

---

## ৮. টাকা ও ডেলিভারির প্রবাহ

### ৮.১ মাল্টি-ভেন্ডর কার্ট
- কার্টে বিভিন্ন বিক্রেতার পণ্য থাকতে পারে
- চেকআউটে একটা **প্যারেন্ট অর্ডার**, ভেতরে বিক্রেতা অনুযায়ী **সাব-অর্ডার** (প্রতিটা আলাদা প্যাকেট, আলাদা ট্র্যাকিং)
- ডেলিভারি চার্জ প্রতি সাব-অর্ডারে (কাস্টমারকে মোট দেখাবে, বিভাজন "বিস্তারিত"-এ)
- কাস্টমারকে সতর্ক করা: "৩ জন বিক্রেতা = ৩টা আলাদা প্যাকেট, ৩ বার ডেলিভারি চার্জ"; একই বিক্রেতার বিকল্প পণ্য থাকলে সাজেশন

### ৮.২ পেমেন্ট পদ্ধতি

| পদ্ধতি | কখন | নোট |
|---|---|---|
| ক্যাশ অন ডেলিভারি | স্টকে থাকা পণ্য, সীমার মধ্যে (ডিফল্ট ৳ ১০,০০০) | কুরিয়ার টাকা তুলে প্ল্যাটফর্মকে দেয় |
| ডেলিভারি চার্জ অগ্রিম + বাকি COD | সীমার বেশি বা নতুন কাস্টমার | |
| অনলাইন (গেটওয়ে, এসক্রো) | যেকোনো অর্ডার; বড় অর্ডার ও রিকোয়েস্ট-অর্ডারে প্রস্তাবিত | bKash/Nagad/কার্ড গেটওয়ে দিয়ে |
| ম্যানুয়াল bKash/Nagad Send Money | গেটওয়ে চালুর আগে (MVP) | অগ্রিম সর্বোচ্চ ১০% (আইনি নিয়ম), Transaction ID অ্যাডমিন যাচাই |
| দোকান থেকে সংগ্রহ | কাস্টমার নিজে যায় | অ্যাপে পেমেন্ট + পিকআপ কোড (৪ সংখ্যা) বিক্রেতাকে বলবে |

### ৮.৩ ডেলিভারি পদ্ধতি

| পদ্ধতি | বিবরণ |
|---|---|
| বিক্রেতা নিজে পাঠায় | বিক্রেতা প্যানেল থেকে কুরিয়ার বুক (প্ল্যাটফর্মের কুরিয়ার অ্যাকাউন্ট দিয়ে, যাতে COD টাকা প্ল্যাটফর্মে আসে) |
| প্ল্যাটফর্ম পিকআপ | রাইডার দোকান থেকে তুলে নেয় (ধোলাইখালের মতো বাজারে দিনে নির্দিষ্ট সময়ে "পিকআপ রাউন্ড") |
| Assured হাব হয়ে | পিকআপ → হাবে QC → কুরিয়ার |
| দোকান থেকে সংগ্রহ | কাস্টমার নিজে, পিকআপ কোড দিয়ে |
| ভারী জিনিস | কুরিয়ার শাখা থেকে সংগ্রহ / ট্রাক-ভ্যান সার্ভিস |

---

## ৯. পলিসি (প্ল্যাটফর্মের ন্যূনতম নিয়ম; বিক্রেতা এর চেয়ে ভালো দিতে পারবে, খারাপ নয়)

### ৯.১ রিটার্ন ও রিফান্ড

| পরিস্থিতি | নিয়ম | খরচ কার |
|---|---|---|
| ভুল পণ্য / বিবরণের সাথে মেলে না (উৎস, অবস্থা, গ্রেড, ফিটমেন্ট ভুল) | পূর্ণ রিফান্ড বা বদল | বিক্রেতা (দুই দিক) |
| ভাঙা/ত্রুটিপূর্ণ অবস্থায় পৌঁছানো | ২৪ ঘণ্টার মধ্যে ছবি/ভিডিওসহ দাবি; পূর্ণ রিফান্ড বা বদল | বিক্রেতা (বা কুরিয়ার, অভ্যন্তরীণভাবে) |
| কাস্টমার ভুল গাড়ি বেছেছিল / মন বদল | বিক্রেতার লিস্টিং "ফেরতযোগ্য" হলে ৩ দিনের মধ্যে, না লাগানো ও অক্ষত অবস্থায় | কাস্টমার (দুই দিক) |
| ইলেকট্রিক্যাল/ইলেকট্রনিক পার্ট লাগানোর পর | ফেরত নয় (ত্রুটিপূর্ণ প্রমাণিত হলে ছাড়া) | |
| ওয়ারেন্টি দাবি | বিক্রেতার দেওয়া ওয়ারেন্টি অনুযায়ী; প্ল্যাটফর্ম মধ্যস্থতা করবে | পাঠানো কাস্টমার, ফেরত বিক্রেতা |

**"ফিটমেন্ট ভুল" কার দোষ:** কাস্টমার "আমার গাড়ি" সঠিকভাবে সেট করে কিনলে, আর লিস্টিংয়ে ওই গাড়িতে ফিট লেখা থাকলে, কিন্তু না লাগলে, সেটা বিক্রেতার ভুল। কাস্টমার গাড়ি সেট না করে বা ⚠️ সতর্কতা উপেক্ষা করে কিনলে, কাস্টমারের দায়।

### ৯.২ বিরোধ নিষ্পত্তি (Dispute)
1. কাস্টমার দাবি করে → বিক্রেতা ৪৮ ঘণ্টায় সাড়া দেবে (মেনে নেওয়া / প্রমাণসহ আপত্তি)
2. সাড়া না দিলে বা কাস্টমার অসন্তুষ্ট হলে → প্ল্যাটফর্মে এসকেলেশন
3. অ্যাডমিন দুই পক্ষের প্রমাণ (ছবি, ভয়েস, চ্যাট, QC ছবি) দেখে সিদ্ধান্ত দেবে, ৭২ ঘণ্টায় প্রথম সাড়া
4. সিদ্ধান্ত অনুযায়ী এসক্রো থেকে রিফান্ড বা বিক্রেতাকে মুক্তি

### ৯.৩ পাঠানোর সময়সীমা
- বিক্রেতা অর্ডার গ্রহণ: ১২ ঘণ্টার মধ্যে (না করলে স্বয়ংক্রিয় বাতিল, স্কোর কাটা)
- কুরিয়ারে হস্তান্তর: পেমেন্ট নিশ্চিতের ৪৮ ঘণ্টার মধ্যে (আইনি)
- ডেলিভারি: একই শহরে ৫ দিন, অন্য শহরে ১০ দিন (আইনি)

---

## ১০. গাড়ি কেনাবেচা মডিউলের নিয়ম (ফেজ ২)

- **বিজ্ঞাপনদাতা:** ব্যক্তি (ফোন + NID যাচাই) বা ডিলার (বিক্রেতা প্যানেলে)
- **বাধ্যতামূলক তথ্য:** ব্র্যান্ড, মডেল, সাল (তৈরি ও রেজিস্ট্রেশন), রিকন্ডিশন/ব্যবহৃত/নতুন, কিমি, জ্বালানি, গিয়ার, রঙ, এলাকা, দাম, কমপক্ষে ৬টা ছবি (সামনে, পেছনে, দুই পাশ, ভেতর, মিটার)
- **কাগজের যাচাই ব্যাজ** (বিক্রেতা আপলোড করলে, টিম দেখে): রেজিস্ট্রেশন সনদ, ট্যাক্স টোকেন বৈধ, ফিটনেস বৈধ, ইন্স্যুরেন্স। কাগজের ছবি পাবলিক নয়, শুধু ✅ ব্যাজ দেখাবে।
- **ইন্সপেকশন:** পেইড সেবা; রিপোর্ট বিজ্ঞাপনে যুক্ত হয় (🔍 "পরীক্ষিত" ব্যাজ)
- **লেনদেন:** শুরুতে অ্যাপে টাকা লেনদেন নেই; চ্যাট/মাস্কড কল দিয়ে যোগাযোগ, সরাসরি দেখা। প্রতারণার সতর্কতা: "গাড়ি না দেখে অগ্রিম টাকা পাঠাবেন না"
- **মালিকানা বদলের চেকলিস্ট** (অ্যাপে দেখাবে, BRTA নিয়ম অনুযায়ী): ক্রেতা ও বিক্রেতা উভয়ের দিক থেকে TO ও TTO ফরম, বিক্রয় রসিদ, উভয়ের NID, মূল রেজিস্ট্রেশন সনদ; গাড়ি ব্যাংক বা লোনে দায়বদ্ধ থাকলে ঋণ পরিশোধের ছাড়পত্র; ফি জমা ও BRTA-তে গাড়ি দেখানো। (ফেজ ৩-এ কাগজপত্র সহায়তা সেবা এটাকে সেবা হিসেবে দেবে।)
- **পরবর্তী সংযোগ:** গাড়ি বিক্রি হলে নতুন মালিককে "আমার গাড়ি"-তে যোগ করার আমন্ত্রণ।

---

## ১১. টেক স্ট্যাক

| স্তর | টুল |
|---|---|
| অ্যাপ | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, **PWA** (কাস্টমার ও বিক্রেতা দুজনের জন্যই, হোম স্ক্রিনে ইনস্টল) |
| অ্যান্ড্রয়েড অ্যাপ (ফেজ ২) | PWA-কে TWA হিসেবে Play Store-এ, অথবা Expo (React Native) যদি নেটিভ ক্যামেরা/নোটিফিকেশন জরুরি হয় |
| ব্যাকএন্ড | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions, pg_cron) |
| সার্চ | Postgres FTS + pg_trgm + synonym টেবিল (ফেজ ২: Meilisearch/Typesense যদি ডেটা বড় হয়) |
| পেমেন্ট | ফেজ ১: ম্যানুয়াল bKash/Nagad (≤১০% অগ্রিম) + COD; ফেজ ১.৫: bKash/Nagad/SSLCommerz গেটওয়ে এসক্রোসহ |
| কুরিয়ার | Pathao / Steadfast / RedX API (বুকিং, ট্র্যাকিং, COD রিকনসিলিয়েশন) |
| ম্যাপ | বাংলাদেশি ম্যাপ সেবা বা Google Maps (দোকানের লোকেশন, দূরত্ব) |
| SMS / OTP | বাংলাদেশি SMS গেটওয়ে |
| ভয়েস | ব্রাউজারে রেকর্ড, Storage-এ সেভ; ট্রান্সক্রিপশন ঐচ্ছিক (bn-BD সাপোর্টসহ STT) |
| TTS (পড়ে শোনানো) | বাংলা TTS API, গুরুত্বপূর্ণ বার্তা প্রি-রেকর্ডেড |
| OCR | পার্ট নম্বর/টায়ার সাইজ লেবেল পড়া (ক্লাউড ভিশন API) |
| ছবি থেকে ক্যাটাগরি | ফেজ ২: ইমেজ ক্লাসিফিকেশন (নিজস্ব লেবেলড ডেটা জমা হলে) |
| WhatsApp | ফেজ ১: wa.me লিংক; ফেজ ২: WhatsApp Business API |
| মাস্কড কল | ফেজ ২: ক্লাউড টেলিফোনি |
| হোস্টিং | Vercel |
| i18n | next-intl (bn ডিফল্ট, en) |

**কোড কাঠামো:** একটা Next.js প্রজেক্ট, তিনটা রুট গ্রুপ: `(customer)` `/`, `(vendor)` `/seller`, `(admin)` `/admin`। শেয়ার্ড কম্পোনেন্ট: ভয়েস রেকর্ডার, ক্যামেরা আপলোডার, গাড়ি বাছাইকারী, ক্যাটাগরি বাছাইকারী, অডিও প্লেয়ার, 🔊 পড়ে শোনানো বাটন।

---

## ১২. ডাটাবেস স্কিমা

> Postgres (Supabase)। সব টেবিলে `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, প্রয়োজনে `updated_at`। টাকা `numeric(12,2)`। নিচে মূল কলাম। ফেজ ২/৩-এর টেবিল চিহ্নিত।

### ১২.১ অ্যাকাউন্ট ও ভূমিকা

**`profiles`** (auth.users-এর সাথে 1:1): `phone`, `full_name`, `avatar_url`, `preferred_lang`, `large_text bool`, `is_blocked`, `force_advance bool` (ঝুঁকিপূর্ণ কাস্টমার), `customer_type` enum: `personal` / `driver` / `mechanic` / `fleet`

**`user_roles`**: `user_id`, `role` enum: `customer` / `vendor_owner` / `vendor_staff` / `car_seller` / `service_provider` / `admin` (অ্যাডমিনের বিস্তারিত রোল `staff_roles`-এ, ফাইল ০৩)

**`addresses`**: `user_id`, `label`, `recipient_name`, `phone`, `division`, `district`, `area`, `address_line`, `landmark`, `lat`, `lng`, `voice_note_id`, `is_default`

### ১২.২ গাড়ির মাস্টার ডেটা

**`vehicle_types`**: `code` (`car`/`micro`/`suv`/`pickup`/`bike`/`cng`/`bus`/`truck`), `name_bn`, `icon_url`, `is_active`
**`vehicle_makes`**: `name`, `name_bn`, `slug`, `logo_url`, `sort_order`, `is_active`
**`vehicle_models`**: `make_id`, `vehicle_type_code`, `name`, `name_bn`, `slug`, `image_url`, `is_popular`
**`vehicle_generations`**: `model_id`, `label`, `year_from`, `year_to`, `chassis_codes text[]`, `facelift` enum: `pre` / `post` / `na`, `image_url`
**`vehicle_engines`**: `code`, `fuel_type` (`petrol`/`diesel`/`hybrid`/`cng`/`ev`), `displacement_cc`, `cylinders`, `aspiration` (`na`/`turbo`)
**`generation_engines`**: `generation_id`, `engine_id` (many-to-many)
**`vehicle_trims`** (ঐচ্ছিক): `generation_id`, `name` (X, G, Luxel), `transmission`, `drive` (`2wd`/`4wd`)

### ১২.৩ আমার গাড়ি

**`user_vehicles`**: `owner_id`, `generation_id`, `engine_id`, `trim_id`, `chassis_number`, `registration_no` (যেমন ঢাকা মেট্রো-গ ১২-৩৪৫৬), `nickname`, `color`, `odometer_km`, `is_primary`, `needs_admin_setup`
**`user_vehicle_members`**: `user_vehicle_id`, `user_id`, `role` (`driver`/`family`), শেয়ার করা ড্রাইভার পার্টস খুঁজতে/রিকোয়েস্ট দিতে পারবে, কেনার আগে মালিকের অনুমোদন ঐচ্ছিক
**`vehicle_documents`**: `user_vehicle_id`, `doc_type` enum: `registration` / `tax_token` / `fitness` / `insurance` / `route_permit` / `driving_license`, `expires_on`, `file_path` (private), `reminder_days_before int[]` (ডিফল্ট `{30,7,1}`)
**`vehicle_service_logs`**: `user_vehicle_id`, `date`, `odometer_km`, `type` (অয়েল চেঞ্জ, ব্রেক...), `cost`, `garage_name`, `notes`, `order_id` (অ্যাপে কেনা পার্টস হলে স্বয়ংক্রিয়)
**`vehicle_expenses`**: `user_vehicle_id`, `date`, `category` (জ্বালানি/পার্টস/সার্ভিস/কাগজ/টোল/পার্কিং/অন্য), `amount`, `note`

### ১২.৪ ক্যাটালগ ও অ্যাট্রিবিউট

**`categories`**: `parent_id`, `level` (১/২/৩), `name`, `name_bn`, `slug`, `icon_url`, `attribute_template` (যেমন `TYRE`, ফাইল ০৪), `default_size_class`, `is_electrical`, `is_restricted`, `min_photos`, `requires_video bool`, `sort_order`, `is_active`
**`attribute_definitions`**: `template` (TYRE...), `key`, `label_bn`, `label_en`, `input_type` enum: `chips` / `multi_chips` / `number` / `text` / `image_choice` / `position_picker` / `checklist` / `date` / `file`, `options jsonb`, `unit`, `required bool`, `required_if jsonb` (যেমন অবস্থা পুরনো হলে), `sort_order`, `help_audio_url`
**`brands`**: `name`, `type` (`oem_vehicle`/`oem_supplier`/`aftermarket`/`local`), `logo_url`, `country`
**`catalog_products`** (মাস্টার পণ্য, ফাইল ০৪ সেকশন ৮): `category_id`, `name`, `name_bn`, `slug`, `brand_id`, `source` (উৎস enum), `part_number`, `part_number_normalized`, `cross_ref_numbers text[]`, `attributes jsonb`, `description_bn`, `images text[]`, `is_universal`, `status` (`active`/`pending_review`/`merged`/`inactive`), `search_vector`
**`listings`** (বিক্রেতার অফার, কাস্টমার যা কেনে)
- `vendor_id`, `catalog_product_id` (nullable: পুরনো/একক জিনিসে null)
- `category_id`, `title`, `title_bn` (null হলে মাস্টার থেকে)
- `source` enum: `genuine` / `oem_brand` / `aftermarket` / `local_made` / `unknown`
- `condition` enum: `new` / `used_import` / `used_local` / `refurbished` / `for_parts`
- `grade` enum (nullable): `A` / `B` / `C` / `D`
- `brand_id`, `part_number`, `part_number_normalized`, `origin_country`
- `attributes jsonb` (টেমপ্লেট অনুযায়ী), `position jsonb`
- `price`, `compare_at_price`, `stock_qty`, `unit` (`piece`/`pair`/`set`/`pack`), `pack_size`
- `warranty_days`, `warranty_terms_bn`, `is_returnable`, `return_window_days`, `is_electrical`
- `size_class` (`small`/`medium`/`large_heavy`), `is_fragile`, `weight_kg`
- `dispatch_days` (কত দিনে পাঠাতে পারবে, ০ = আজই)
- `is_universal`, `is_assured_eligible`
- `donor_vehicle_id` (nullable, হাফকাট গাড়ি থেকে হলে)
- `description_bn`, `voice_note_id`
- `quality_score int`, `status` enum: `draft` / `pending_review` / `active` / `paused` / `rejected` / `sold_out` / `removed`, `rejection_reason`
- `views`, `search_vector`
**`listing_media`**: `listing_id`, `path`, `kind` (`image`/`video`), `role` (`main`/`label`/`defect`/`running_video`/`other`), `sort_order`, `phash` (ডুপ্লিকেট ছবি শনাক্তের জন্য)
**`fitments`**: `listing_id` বা `catalog_product_id` (একটা থাকবে), `make_id`, `model_id`, `generation_id`, `engine_id`, `trim_id`, `notes` (null মানে সেই স্তরের সব)
**`donor_vehicles`** (হাফকাট বিক্রেতার দাতা গাড়ি): `vendor_id`, `generation_id`, `engine_id`, `color`, `odometer_km`, `images`, `notes`
**`part_synonyms`**: `term`, `term_normalized`, `category_id`, `maps_to_keyword`, `dialect_region`, `source`, `usage_count`
**`price_benchmarks`** (বাজারদর, স্বয়ংক্রিয় হিসাব): `category_id`, `generation_id`, `source`, `condition`, `p25`, `median`, `p75`, `sample_size`, `computed_at`

### ১২.৫ বিক্রেতা

**`vendors`**
- `owner_id`, `shop_name`, `shop_name_bn`, `slug`, `logo_url`, `cover_url`
- `vendor_types text[]` (সেকশন ৩.২)
- `market_area` (ধোলাইখাল, নবাবপুর, বাংলামোটর...), `address`, `district`, `lat`, `lng`
- `specialty_makes uuid[]`, `specialty_categories uuid[]`
- `opening_hours jsonb`, `is_open_now` (computed), `holiday_mode bool`
- `verification_level int` (০ থেকে ৩), `badges text[]`
- `score int`, `rating_avg`, `rating_count`
- `commission_plan_id`, `subscription_tier` (`free`/`basic`/`pro`)
- `accepts_requests bool`, `request_regions text[]`
- `default_return_policy jsonb`, `default_warranty_days`
- `status` enum: `onboarding` / `pending_verification` / `active` / `suspended` / `closed`
- `agreement_accepted_at`, `agreement_version`
**`vendor_staff`**: `vendor_id`, `user_id`, `permissions text[]` (`listings`/`orders`/`requests`/`finance`/`chat`)
**`vendor_verifications`**: `vendor_id`, `level`, `doc_type` (`nid_front`/`nid_back`/`selfie`/`trade_license`/`shop_photo`/`visit_report`), `file_path`, `status`, `reviewed_by`, `notes`
**`vendor_payout_methods`**: `vendor_id`, `method` (`bkash`/`nagad`/`bank`), `account_name`, `account_number_masked`, `account_number_encrypted`, `is_default`, `verified`
**`vendor_follows`**: `user_id`, `vendor_id` (কাস্টমার দোকান ফলো করতে পারবে)

### ১২.৬ রিকোয়েস্ট ও কোট

**`part_requests`**
- `request_no`, `user_id` (nullable), `guest_phone`, `contact_name`
- `user_vehicle_id`, `vehicle_text`, `generation_id` (পরিষ্কারের পর)
- `description_text`, `preferred_sources text[]`, `preferred_conditions text[]`
- `items jsonb` (পরিষ্কারের পর: `[{category_id, name, qty, position}]`)
- `district`, `area` (বিক্রেতারা শুধু এটুকু দেখবে)
- `delivery_needed_by` (ঐচ্ছিক)
- `status` enum: `new` / `needs_clarification` / `open` / `quotes_received` / `accepted` / `expired` / `cancelled` / `not_found`
- `expires_at`, `broadcast_at`, `vendors_notified int`, `source` (`web_voice`/`web_photo`/`web_text`/`phone`/`whatsapp`)
- `assigned_admin` (পরিষ্কার করার দায়িত্ব)
**`request_reviews`** (টিমের পরিষ্কার নোট; ফাইল ০৩)
**`request_vendor_matches`**: `request_id`, `vendor_id`, `notified_at`, `seen_at`, `declined bool`, `decline_reason`
**`request_questions`**: `request_id`, `vendor_id`, `question`, `answer`, `answered_at`, `is_public bool`
**`quotes`**
- `request_id`, `vendor_id`, `item_index` (রিকোয়েস্টের কোন আইটেম)
- `listing_id` (nullable, বিদ্যমান লিস্টিং থেকে কোট)
- `title`, `source`, `condition`, `grade`, `brand_id`, `part_number`, `attributes jsonb`
- `price`, `delivery_charge_estimate`, `dispatch_days`, `warranty_days`, `is_returnable`
- `media text[]`, `note_bn`, `voice_note_id`
- `quote_score`, `valid_until`
- `status` enum: `submitted` / `withdrawn` / `accepted` / `not_selected` / `expired`

### ১২.৭ কার্ট ও অর্ডার

**`carts`**: `user_id` বা `session_id`; **`cart_items`**: `cart_id`, `listing_id` বা `quote_id`, `qty`, `added_at`
**`orders`** (প্যারেন্ট): `order_no`, `user_id`, `address_snapshot jsonb`, `subtotal`, `delivery_total`, `discount_total`, `grand_total`, `payment_method`, `payment_status` (`unpaid`/`partial`/`paid`/`refunded`/`partially_refunded`), `user_vehicle_id`, `source` (`cart`/`request`/`admin_phone`)
**`vendor_orders`** (সাব-অর্ডার, কাজের মূল একক)
- `order_id`, `vendor_id`, `sub_order_no`
- `status` enum: `pending_vendor` / `accepted` / `rejected_by_vendor` / `ready_to_ship` / `picked_up` / `at_hub_qc` / `qc_failed` / `shipped` / `delivered` / `cancelled` / `return_requested` / `returned` / `completed`
- `fulfillment` enum: `vendor_ship` / `platform_pickup` / `assured_hub` / `store_pickup`
- `subtotal`, `delivery_charge`, `commission_amount`, `vendor_payable`
- `cod_amount`, `courier`, `tracking_no`, `pickup_code`
- `accept_by`, `handover_by`, `deliver_by` (আইনি সময়সীমা, স্বয়ংক্রিয় হিসাব)
- `delivered_at`, `return_window_ends_at`, `settled_at`
**`order_items`**: `vendor_order_id`, `listing_id`, `quote_id`, `snapshot jsonb` (শিরোনাম, উৎস, অবস্থা, গ্রেড, ছবি, ওয়ারেন্টি, ফেরত নিয়ম; কেনার সময়ের অবস্থা সংরক্ষণ), `unit_price`, `qty`, `line_total`
**`order_status_history`**: `vendor_order_id`, `from`, `to`, `actor_type` (`customer`/`vendor`/`admin`/`system`), `actor_id`, `note`
**`payments`**: `order_id`, `method` (`cod`/`bkash_manual`/`nagad_manual`/`gateway`), `amount`, `purpose` (`advance`/`full`/`delivery_charge`/`cod_collection`), `gateway_ref`, `sender_number`, `transaction_id`, `screenshot_path`, `status` (`initiated`/`submitted`/`verified`/`failed`/`rejected`/`refunded`), `verified_by`
**`qc_checks`**: `vendor_order_id` / `order_item_id`, `checked_by`, `checklist jsonb`, `photos text[]`, `result`, `fail_reason`

### ১২.৮ টাকার হিসাব (লেজার)

**`wallet_ledger`** (ডাবল-এন্ট্রি ধাঁচে, প্রতিটা টাকার চলাচল): `account_type` (`vendor`/`platform`/`customer_refund`/`courier`), `account_id`, `vendor_order_id`, `entry_type` (`sale_credit`/`commission_debit`/`delivery_debit`/`refund_debit`/`payout_debit`/`adjustment`/`penalty`), `amount` (+/-), `balance_after`, `available_at` (রিটার্ন উইন্ডো শেষের পর), `note`
**`commission_plans`**: `name`, `rules jsonb` (ক্যাটাগরি অনুযায়ী %), `min_fee`, `valid_from`
**`payouts`**: `vendor_id`, `amount`, `method_id`, `status` (`requested`/`processing`/`paid`/`failed`), `reference`, `period_from`, `period_to`, `processed_by`
**`refunds`**: `order_id`, `vendor_order_id`, `claim_id`, `amount`, `method`, `destination`, `status`, `due_by` (আইনি সময়সীমা), `processed_at`, `reference`

### ১২.৯ দাবি, রিভিউ, অভিযোগ

**`claims`**: `claim_no`, `vendor_order_id`, `order_item_id`, `user_id`, `vendor_id`, `type` enum: `not_as_described` / `wrong_fitment` / `damaged_on_arrival` / `missing_item` / `warranty` / `change_of_mind` / `not_delivered`, `description`, `media text[]`, `voice_note_id`, `status` enum: `submitted` / `vendor_review` / `vendor_accepted` / `vendor_disputed` / `escalated` / `admin_review` / `resolved_refund` / `resolved_replace` / `resolved_rejected` / `awaiting_return` / `closed`, `vendor_response`, `vendor_respond_by`, `resolution`, `refund_amount`, `return_shipping_paid_by`, `decided_by`, `decision_note`
**`reviews`**: `vendor_order_id`, `user_id`, `vendor_id`, `listing_id`, `rating 1..5`, `tags text[]` (যেমন "যেমন বলেছে তেমন", "দ্রুত পাঠিয়েছে", "ভালো প্যাকিং"; টাইপ না করে চিপ), `comment`, `voice_note_id`, `vendor_reply`, `is_visible`
**`complaints`** (সাধারণ অভিযোগ, আইনি বাধ্যবাধকতা): `user_id`, `subject_type`, `subject_id`, `description`, `status`, `first_response_by` (৭২ ঘণ্টা), `assigned_to`
**`reports`** (পণ্য/বিক্রেতা/বিজ্ঞাপন রিপোর্ট): `reporter_id`, `target_type`, `target_id`, `reason` (`fake`/`stolen_suspect`/`wrong_info`/`scam`/`other`), `details`, `status`

### ১২.১০ যোগাযোগ

**`chat_threads`**: `type` enum: `customer_vendor` / `customer_support` / `vendor_support` / `car_listing`, `customer_id`, `vendor_id`, `context_type` (`listing`/`quote`/`request`/`vendor_order`/`car_listing`), `context_id`, `last_message_at`, `unread_customer`, `unread_other`
**`chat_messages`**: `thread_id`, `sender_id`, `sender_role`, `type` (`text`/`voice`/`image`/`listing_card`/`quote_card`/`order_card`/`system`), `body`, `body_masked` (ফোন নম্বর লুকানো সংস্করণ), `contains_contact_info bool`, `voice_note_id`, `media_path`, `ref_id`, `read_at`
**`call_requests`**: `requester_id`, `target_type` (`vendor`/`support`/`car_seller`), `target_id`, `context`, `status`, `scheduled_for` (ফেজ ১: কলব্যাক অনুরোধ; ফেজ ২: মাস্কড কল লগ)
**`voice_notes`**, **`media_uploads`**: v1-এর মতো (owner, path, mime, duration, entity, transcript, transcript_confidence, transcript_status, delete_after)
**`notifications`**, **`push_subscriptions`**: v1-এর মতো, `audience` (`customer`/`vendor`/`admin`) যোগ

### ১২.১১ গাড়ি কেনাবেচা (ফেজ ২)

**`car_listings`**
- `seller_type` (`individual`/`dealer`), `seller_user_id`, `vendor_id` (ডিলার হলে)
- `make_id`, `model_id`, `generation_id`, `trim_id`, `engine_id`
- `manufacture_year`, `registration_year`, `condition` (`new`/`reconditioned`/`used`), `auction_grade` (রিকন্ডিশনে, যেমন 4.5), `odometer_km`, `fuel_type`, `transmission`, `color`, `body_type`, `seats`, `owners_count`
- `registration_area` (ঢাকা মেট্রো ইত্যাদি), `district`, `area`
- `price`, `is_negotiable`, `description_bn`, `voice_note_id`
- `features text[]` (চিপ: স্মার্ট কী, পুশ স্টার্ট, সানরুফ, রিভার্স ক্যামেরা...)
- `doc_badges text[]` (যাচাইয়ের পর: `registration_ok`, `tax_token_valid`, `fitness_valid`, `insurance_valid`)
- `inspection_id` (nullable)
- `status` enum: `draft` / `pending_review` / `active` / `reserved` / `sold` / `expired` / `rejected` / `removed`
- `boosted_until`, `views`, `expires_at` (৬০ দিন)
**`car_listing_media`**: `car_listing_id`, `path`, `role` (`front`/`back`/`left`/`right`/`interior`/`dashboard`/`engine`/`other`/`video`), `sort_order`
**`car_listing_documents`** (private): `car_listing_id`, `doc_type`, `path`, `status`, `reviewed_by`
**`car_inquiries`**: `car_listing_id`, `buyer_id`, `thread_id`, `status` (`new`/`contacted`/`visit_scheduled`/`closed`), `visit_at`
**`car_saved_searches`**: `user_id`, `filters jsonb`, `notify bool`

### ১২.১২ সেবা ও ইন্সপেকশন (ফেজ ২/৩)

**`service_providers`**: `vendor_id` বা নিজস্ব প্রোফাইল, `type` (`garage`/`wash`/`towing`/`inspection`/`paper_agent`), `coverage_areas`, `lat`, `lng`, `rating`
**`services`**: `provider_id`, `category` (অয়েল চেঞ্জ, এসি সার্ভিস, ফিটিং, ওয়াশ...), `title_bn`, `price_from`, `price_to`, `duration_min`, `at_home bool`, `applicable_vehicle_types text[]`
**`bookings`**: `booking_no`, `user_id`, `user_vehicle_id`, `service_id`, `provider_id`, `slot_at`, `location`, `linked_order_id` (পার্টস কিনে ফিটিং হলে), `status` (`requested`/`confirmed`/`in_progress`/`completed`/`cancelled`/`no_show`), `price_final`, `payment_status`
**`inspections`**: `car_listing_id` বা `user_vehicle_id`, `inspector_id`, `scheduled_at`, `checklist jsonb` (২০০ পয়েন্ট পর্যন্ত, বিভাগ অনুযায়ী), `overall_score`, `photos`, `report_pdf_path`, `status`
**`roadside_requests`** (ফেজ ৩): `user_id`, `type` (`tow`/`jump_start`/`flat_tyre`/`fuel`/`lockout`), `lat`, `lng`, `provider_id`, `status`, `eta_min`

### ১২.১৩ সিস্টেম

**`settings`** (key-value, সব সংখ্যা এখান থেকে): `cod_limit`, `manual_advance_max_percent = 10`, `return_window_days = 3`, `damage_claim_hours = 24`, `vendor_accept_hours = 12`, `handover_hours = 48`, `delivery_days_same_city = 5`, `delivery_days_other = 10`, `request_expiry_hours = 72`, `max_quotes_per_request = 10`, `vendor_dispute_response_hours = 48`, `complaint_first_response_hours = 72`, `voice_retention_days = 90`, `guest_requests_per_day = 5`, `min_order_value`, `payout_schedule`, `used_airbag_allowed = false`, ইত্যাদি
**`delivery_rates`**: `zone`, `size_class`, `fulfillment`, `charge`, `courier_cost`
**`search_logs`**, **`audit_logs`**, **`canned_replies`**, **`staff_roles`**, **`internal_notes`**, **`call_logs`**: ফাইল ০৩-এ বিস্তারিত

---

## ১৩. স্ট্যাটাস ফ্লো

**রিকোয়েস্ট**
```
new → (ভয়েস/অস্পষ্ট হলে) needs_clarification → open → quotes_received → accepted
open/quotes_received → expired (মেয়াদ শেষে, কাস্টমার নবায়ন করলে আবার open)
যেকোনো ধাপ → cancelled; open (কোনো কোট না এলে ৭২ ঘণ্টায়) → not_found (অ্যাডমিন হস্তক্ষেপ)
```

**কোট**
```
submitted → accepted / not_selected / withdrawn / expired
```

**সাব-অর্ডার (vendor_orders)**
```
pending_vendor → accepted → ready_to_ship
   → (vendor_ship) shipped → delivered
   → (platform_pickup) picked_up → shipped → delivered
   → (assured_hub) picked_up → at_hub_qc → shipped → delivered  |  at_hub_qc → qc_failed → cancelled (রিফান্ড)
   → (store_pickup) delivered (পিকআপ কোড মিললে)
pending_vendor → rejected_by_vendor (বা ১২ ঘণ্টায় সাড়া না দিলে স্বয়ংক্রিয়) → রিফান্ড/বিকল্প সাজেশন
delivered → (রিটার্ন উইন্ডো শেষ, দাবি নেই) completed → টাকা বিক্রেতার ওয়ালেটে available
delivered → return_requested → returned → (রিফান্ড)
```

**দাবি**
```
submitted → vendor_review → vendor_accepted → (রিটার্ন লাগলে awaiting_return) → resolved_refund / resolved_replace → closed
vendor_review → vendor_disputed → escalated → admin_review → resolved_* → closed
vendor_review (৪৮ ঘণ্টা সাড়া নেই) → escalated
```

**বিক্রেতা অনবোর্ডিং**
```
onboarding → pending_verification → active → (স্কোর কম/অভিযোগ) suspended → active / closed
```

**গাড়ির বিজ্ঞাপন**
```
draft → pending_review → active → reserved → sold
active → expired (৬০ দিন) → (নবায়ন) active
pending_review → rejected
```

প্রতিটা পরিবর্তন লগ হবে ও নোটিফিকেশন ট্রিগার করবে।

---

## ১৪. সিকিউরিটি ও প্রাইভেসি

- সব টেবিলে RLS। কাস্টমার নিজের ডেটা, বিক্রেতা নিজের দোকানের ডেটা (`vendor_staff` দিয়ে), অ্যাডমিন রোল অনুযায়ী।
- বিক্রেতা কাস্টমারের ফোন/পূর্ণ ঠিকানা দেখবে **শুধু** যখন সাব-অর্ডার `accepted` এবং fulfillment `vendor_ship` (প্যাকেটে লেখার জন্য); ডেলিভারির ৭ দিন পর আবার লুকানো।
- রিকোয়েস্টে বিক্রেতা শুধু জেলা/এলাকা দেখবে।
- NID, ট্রেড লাইসেন্স, গাড়ির কাগজ: private bucket, শুধু অ্যাডমিন যাচাইকারী signed URL দিয়ে।
- পেআউট অ্যাকাউন্ট নম্বর এনক্রিপ্টেড; UI-তে শেষ ৪ সংখ্যা।
- ইঞ্জিন নম্বর পাবলিকে আংশিক লুকানো।
- রেট লিমিট: OTP, গেস্ট রিকোয়েস্ট, চ্যাট মেসেজ, কোট জমা।
- ফাইল আপলোড: টাইপ/সাইজ চেক; ছবি ≤৮MB, ভিডিও ≤৫০MB (৬০ সেকেন্ড), অডিও ≤৩MB।

---

## ১৫. মাপকাঠি (KPI)

| মাপকাঠি | লক্ষ্য (প্রথম ৬ মাস) |
|---|---|
| রিকোয়েস্টে প্রথম কোট আসার সময় (মধ্যমা) | ২ ঘণ্টার কম |
| রিকোয়েস্ট → অর্ডার রূপান্তর | ২৫%+ |
| "যেমন বলা হয়েছিল তেমন না" দাবি | অর্ডারের ৩% এর কম |
| বিক্রেতার প্রথম পণ্য আপলোডের সময় | ৩ মিনিটের কম |
| সক্রিয় বিক্রেতা (মাসে ১+ বিক্রি) | ১০০+ |
| কাস্টমারের দ্বিতীয় অর্ডার (৯০ দিনে) | ৩০%+ |
| "আমার গাড়ি" সেট করা কাস্টমার | ৬০%+ |
| শূন্য ফলাফলের সার্চ | ১৫% এর কম |

---

## ১৬. সার্বিক বিল্ড ক্রম

**ফেজ ১ (মার্কেটপ্লেস MVP)**
1. প্রজেক্ট সেটআপ, ডিজাইন সিস্টেম (বড় বাটন, আইকন, রঙের অর্থ), শেয়ার্ড কম্পোনেন্ট (ভয়েস, ক্যামেরা, গাড়ি বাছাই, ক্যাটাগরি বাছাই, 🔊)
2. ডাটাবেস: সেকশন ১২.১ থেকে ১২.১০ ও ১২.১৩, RLS, সিড ডেটা (গাড়ি, ক্যাটাগরি ট্রি ও অ্যাট্রিবিউট ফাইল ০৪ থেকে, synonym)
3. অ্যাডমিন: ক্যাটালগ ও গাড়ির ডেটা ব্যবস্থাপনা, বিক্রেতা যাচাই (ফাইল ০৩)
4. বিক্রেতা প্যানেল: অনবোর্ডিং, পণ্য আপলোড, অর্ডার (ফাইল ০২)
5. কাস্টমার: হোম, আমার গাড়ি, সার্চ, লিস্টিং, দোকান পেজ, তুলনা (ফাইল ০১)
6. রিকোয়েস্ট ও দরদাম: কাস্টমার → অ্যাডমিন পরিষ্কার → বিক্রেতা কোট → কাস্টমার তুলনা
7. কার্ট, চেকআউট, পেমেন্ট (COD + ম্যানুয়াল ≤১০%), কুরিয়ার
8. লেজার, কমিশন, পেআউট
9. দাবি ও বিরোধ, রিভিউ
10. চ্যাট (নম্বর লুকানোসহ), নোটিফিকেশন, SMS
11. আমার গাড়ি: কাগজের রিমাইন্ডার, খরচ ও সার্ভিস লগ
12. বাস্তব ইউজার পরীক্ষা (সেকশন ২), সংশোধন, চালু

**ফেজ ১.৫:** পেমেন্ট গেটওয়ে এসক্রো, কুরিয়ার API, Assured হাব, WhatsApp Business API
**ফেজ ২:** গাড়ি কেনাবেচা, মেকানিক/গ্যারেজ বুকিং + পার্টস-ফিটিং বান্ডেল, ইন্সপেকশন, মাস্কড কল, অ্যান্ড্রয়েড অ্যাপ, সাবস্ক্রিপশন ও প্রচার
**ফেজ ৩:** রাস্তায় সাহায্য, সার্ভিস প্যাকেজ, কাগজপত্র সহায়তা, ইন্স্যুরেন্স/লোন পার্টনার, বাস-ট্রাক-বাইক পার্টস

---

## ১৭. বড় ঝুঁকি ও প্রতিকার

| ঝুঁকি | প্রতিকার |
|---|---|
| বিক্রেতারা আসবে না (মুরগি-ডিম সমস্যা) | শুরুতে ০% কমিশন, মাঠকর্মী দিয়ে আপলোড, ধোলাইখালে ক্লাস্টার ধরে শুরু (৫০টা দোকান), রিকোয়েস্ট দিয়ে বিক্রেতাদের কাছে "রেডি কাস্টমার" পাঠানো |
| প্রতারক বিক্রেতা | যাচাইয়ের স্তর, এসক্রো, স্কোর, Assured, দ্রুত স্থগিত |
| প্ল্যাটফর্মের বাইরে লেনদেন | নম্বর লুকানো, ক্রেতা সুরক্ষা শুধু অ্যাপে, কম কমিশন |
| ক্যাটালগ অগোছালো (একই জিনিস ১০০ রকম নামে) | মাস্টার পণ্য, ক্যাটালগ টিমের পর্যালোচনা, synonym, ডুপ্লিকেট শনাক্ত |
| খুব বেশি ফিচার, জটিল অ্যাপ | কঠোর ফেজ, সেকশন ২-এর নিয়ম, হোমে সর্বোচ্চ ৬টা টাইল |
| ফিটমেন্ট ভুল → রিটার্ন | আমার গাড়ি বাধ্যতামূলক উৎসাহ, ⚠️ সতর্কতা, দায় নির্ধারণের স্পষ্ট নিয়ম |
| আইনি (অগ্রিম, রিফান্ড সময়সীমা) | সেকশন ৫ অনুযায়ী সিস্টেমে প্রয়োগ, আইনজীবীর পরামর্শ |
| COD ফেরত (কাস্টমার নেয় না) | ঝুঁকিপূর্ণ কাস্টমারে অগ্রিম বাধ্যতামূলক, ডেলিভারি চার্জ অগ্রিম, কনফার্মেশন কল |
