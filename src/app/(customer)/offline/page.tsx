import { WifiOff } from "lucide-react";
import { AudioGuide } from "@/components/layout/AudioGuide";
import { telLink } from "@/lib/links";
import { settings } from "@/lib/mock/settings";

export const metadata = { title: "ইন্টারনেট নেই" };

// Service-worker fallback (public/sw.js). Kept static so it renders from cache
// even when scripts can't load; text is shown in both languages.
export default function OfflinePage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-4 text-center">
      <span className="mx-auto mt-6 grid size-20 place-items-center rounded-3xl bg-wait-soft text-wait">
        <WifiOff className="size-10" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold">ইন্টারনেট সংযোগ নেই</h1>
      <p className="text-muted">No internet connection</p>
      <p className="text-lg">নেট ফিরলে আবার চেষ্টা করুন। আপনার রিকোয়েস্টের ড্রাফট ও ভয়েস এই ফোনে সেভ আছে, কিছু হারাবে না।</p>
      <AudioGuide className="flex flex-col items-center" text="ইন্টারনেট সংযোগ নেই। নেট ফিরলে আবার চেষ্টা করুন বাটন চাপুন। জরুরি হলে কল করুন।" label="শুনুন" />
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full reload is the point when offline */}
      <a href="/" className="flex min-h-14 items-center justify-center rounded-2xl bg-ink px-5 text-lg font-semibold text-white">
        🔄 আবার চেষ্টা করুন · Retry
      </a>
      <a href={telLink()} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-ok/40 bg-card px-5 text-lg font-semibold text-ok">
        📞 কল করুন · {settings.hotline_display}
      </a>
    </div>
  );
}
