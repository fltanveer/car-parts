import type { Metadata } from "next";
import { OfflineActions } from "@/components/account/OfflineActions";

export const metadata: Metadata = { title: "অফলাইন" };

// PWA fallback when a page isn't cached and there's no network. Kept static
// and bilingual so the cached copy works whatever the language cookie was.
export default function OfflinePage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-4 py-8 text-center">
      <div className="mx-auto grid size-20 place-items-center rounded-full bg-accent-soft text-4xl" aria-hidden>
        📶
      </div>
      <div>
        <h1 className="text-2xl font-bold">ইন্টারনেট সংযোগ নেই</h1>
        <p className="text-muted">No internet connection</p>
      </div>
      <p className="text-ink-2">
        নেট ফিরলে আবার চেষ্টা করুন। জরুরি হলে সরাসরি কল করুন, কল করতে ইন্টারনেট লাগে না।
        <br />
        <span className="text-sm text-muted">Try again when you&apos;re back online. For urgent needs, call us: calls don&apos;t need internet.</span>
      </p>
      <OfflineActions />
    </div>
  );
}
