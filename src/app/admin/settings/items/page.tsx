"use client";

import { ItemsEditor } from "@/components/admin/core/settings/ItemsEditor";
import { SettingsFrame } from "@/components/admin/core/settings/SettingsFrame";
import { useT } from "@/components/providers/LangProvider";

export default function ProhibitedItemsPage() {
  const { tx } = useT();
  return (
    <SettingsFrame
      title={tx("নিষিদ্ধ ও সীমিত জিনিস", "Prohibited & restricted items")}
      subtitle={tx("ফাইল ০৪ সেকশন ১০ অনুযায়ী", "Per taxonomy §10")}
      guide={tx(
        "প্রতিটা নিয়মের পাশে সুইচ আছে। সবুজ মানে নিয়ম চালু। পুরনো এয়ারব্যাগ বিক্রি চালু বা বন্ধ করতে উপরের বড় সুইচ ব্যবহার করুন।",
        "Each rule has a switch; green means enforced. Use the big switch at the top to allow or block undeployed used airbags.",
      )}
    >
      {(canEdit) => <ItemsEditor canEdit={canEdit} />}
    </SettingsFrame>
  );
}
