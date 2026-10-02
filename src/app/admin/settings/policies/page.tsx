"use client";

import { AdminPage } from "@/components/admin/core";
import { PoliciesEditor } from "@/components/admin/core/settings/PoliciesEditor";
import { ReadOnlyNotice, SettingsNav, useSettingsAccess } from "@/components/admin/core/settings/SettingsNav";
import { useT } from "@/components/providers/LangProvider";

export default function PoliciesPage() {
  const { tx } = useT();
  const { canEdit } = useSettingsAccess();
  return (
    <AdminPage
      title={tx("পলিসি টেক্সট", "Policy texts")}
      subtitle={tx("আইনি পলিসি বাংলায়, সংস্করণসহ", "Legal policies in Bangla, with versions")}
      guide={tx(
        "বাম পাশ থেকে পলিসি বাছুন। শুনুন বাটনে পড়ে শোনানো হবে। লেখা বদলে সেভ করলে নতুন সংস্করণ হয়, পুরনোগুলো ইতিহাসে থাকে। বিক্রেতা চুক্তি বদলালে সবাইকে আবার গ্রহণ করতে বলুন।",
        "Pick a policy on the left. Listen reads it aloud. Saving an edit creates a new version; old ones stay in history. After changing the seller agreement, ask sellers to re-accept.",
      )}
    >
      <SettingsNav />
      <ReadOnlyNotice show={!canEdit} />
      <PoliciesEditor canEdit={canEdit} />
    </AdminPage>
  );
}
