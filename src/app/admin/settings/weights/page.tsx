"use client";

import { SettingsFrame } from "@/components/admin/core/settings/SettingsFrame";
import { WeightsEditor } from "@/components/admin/core/settings/WeightsEditor";
import { useT } from "@/components/providers/LangProvider";

export default function WeightsPage() {
  const { tx } = useT();
  return (
    <SettingsFrame
      title={tx("স্কোরের ওজন", "Score weights")}
      subtitle={tx("\"সেরা পছন্দ\" দাম সাজানো ও বিক্রেতা স্কোর", "\"Best choice\" quote ranking and seller score")}
      guide={tx(
        "প্রতিটা বিষয়ের পাশে কত শতাংশ গুরুত্ব তা লিখুন। নিচের মোট সবুজ (১০০) হলে সেভ বাটন চালু হবে।",
        "Enter the percent weight next to each factor. Save turns on when the total shows green (100).",
      )}
    >
      {(canEdit) => <WeightsEditor canEdit={canEdit} />}
    </SettingsFrame>
  );
}
