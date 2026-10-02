import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireLogin } from "@/components/auth/RequireLogin";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { getT } from "@/lib/server-lang";

export const metadata: Metadata = { title: "চ্যাট" };

export default async function ChatPage() {
  const { tx } = await getT();
  return (
    <RequireLogin reason={tx("চ্যাট করতে ফোন নম্বর দিয়ে লগইন করুন", "Log in with your phone number to chat")}>
      <Suspense fallback={null}>
        <ChatScreen />
      </Suspense>
    </RequireLogin>
  );
}
