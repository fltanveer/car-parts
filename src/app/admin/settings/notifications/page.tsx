"use client";

import { AdminPage } from "@/components/admin/core";
import { ReadOnlyNotice, SettingsNav, useSettingsAccess } from "@/components/admin/core/settings/SettingsNav";
import { TemplatesEditor } from "@/components/admin/core/settings/TemplatesEditor";
import { useT } from "@/components/providers/LangProvider";

export default function NotificationTemplatesPage() {
  const { tx } = useT();
  const { canEdit } = useSettingsAccess();
  return (
    <AdminPage
      title={tx("SMS ও নোটিফিকেশন টেমপ্লেট", "SMS & notification templates")}
      subtitle={tx("কাস্টমার ও বিক্রেতার জন্য আলাদা, ভেরিয়েবলসহ", "Separate for customers and sellers, with variables")}
      guide={tx(
        "উপরে কাস্টমার বা বিক্রেতা বাছুন, তারপর একটা টেমপ্লেট। নীল চিপ চাপলে ভেরিয়েবল লেখায় বসে। বাংলা SMS-এ ৭০ অক্ষরে এক SMS; লাল হলে লেখা ছোট করুন। পাশে নমুনা প্রিভিউ দেখুন।",
        "Pick customer or seller, then a template. Tap a blue chip to insert a variable. A Bangla SMS fits 70 characters; red means shorten it. Check the preview with sample values.",
      )}
    >
      <SettingsNav />
      <ReadOnlyNotice show={!canEdit} />
      <TemplatesEditor canEdit={canEdit} />
    </AdminPage>
  );
}
