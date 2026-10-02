"use client";

import { AudioFiles } from "@/components/admin/core/settings/AudioFiles";
import { SettingsFrame } from "@/components/admin/core/settings/SettingsFrame";
import { useT } from "@/components/providers/LangProvider";

export default function AudioGuidePage() {
  const { tx } = useT();
  return (
    <SettingsFrame
      title={tx("অডিও গাইড ফাইল", "Audio guide files")}
      subtitle={tx("🔊 বাটনের জন্য মানুষের কণ্ঠে রেকর্ড করা নির্দেশনা", "Human-voice recordings for the 🔊 buttons")}
      guide={tx(
        "একটা স্ক্রিনের পাশে রেকর্ড বাটন চাপুন, মাইকে ধীরে ও পরিষ্কার বাংলায় নির্দেশনা বলুন, তারপর রাখুন। রেকর্ড না থাকলে যন্ত্রের কণ্ঠে পড়ে শোনানো হয়।",
        "Press Record next to a screen, read the instructions slowly in clear Bangla, then keep it. Screens without a file use the browser voice.",
      )}
    >
      {(canEdit) => <AudioFiles canEdit={canEdit} />}
    </SettingsFrame>
  );
}
