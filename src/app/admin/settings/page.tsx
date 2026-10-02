"use client";

import { AdminPage } from "@/components/admin/core";
import { GeneralSettings } from "@/components/admin/core/settings/GeneralSettings";
import { ReadOnlyNotice, SettingsNav, useSettingsAccess } from "@/components/admin/core/settings/SettingsNav";
import { useT } from "@/components/providers/LangProvider";

export default function SettingsPage() {
  const { tx } = useT();
  const { canEdit } = useSettingsAccess();
  return (
    <AdminPage
      title={tx("সেটিংস", "Settings")}
      subtitle={tx("সব সংখ্যা, সময়সীমা ও সীমা এখান থেকে। প্রতিটা পরিবর্তন অডিট লগে যায়।", "Every number, deadline and limit lives here. Each change is audited.")}
      guide={tx(
        "প্রতিটা ঘরে নতুন সংখ্যা লিখে সবুজ সেভ বাটন চাপুন। হলুদ দাগ মানে ডিফল্ট থেকে বদলানো, ডিফল্ট বাটনে আগের মানে ফেরানো যায়। উপরের ট্যাবে কমিশন, পলিসি, টেমপ্লেট ও অন্য সেটিংস।",
        "Type a new value and press the green Save. Yellow means changed from default; Default restores it. Use the tabs above for commission, policies, templates and more.",
      )}
    >
      <SettingsNav />
      <ReadOnlyNotice show={!canEdit} />
      <GeneralSettings canEdit={canEdit} />
    </AdminPage>
  );
}
