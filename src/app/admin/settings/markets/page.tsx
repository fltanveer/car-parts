"use client";

import { MarketsEditor } from "@/components/admin/core/settings/MarketsEditor";
import { SettingsFrame } from "@/components/admin/core/settings/SettingsFrame";
import { useT } from "@/components/providers/LangProvider";

export default function MarketsPage() {
  const { tx } = useT();
  return (
    <SettingsFrame
      title={tx("বাজার এলাকার তালিকা", "Market areas")}
      subtitle={tx("ধোলাইখাল, নবাবপুর, বাংলামোটর…", "Dholaikhal, Nawabpur, Banglamotor…")}
      guide={tx(
        "নতুন বাজার যোগ করতে উপরের বাটন চাপুন। প্রতিটা বাজারে রাইডার কখন পিকআপে যাবে সেই সময় যোগ করুন, তারপর সেভ।",
        "Press New market to add one. Add the times riders go for pickup in each market, then save.",
      )}
    >
      {(canEdit) => <MarketsEditor canEdit={canEdit} />}
    </SettingsFrame>
  );
}
