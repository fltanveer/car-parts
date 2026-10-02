"use client";

import { useParams } from "next/navigation";
import { ChatView } from "@/components/customer/my/ChatView";

export default function ThreadPage() {
  const { thread } = useParams<{ thread: string }>();
  return <ChatView id={thread} />;
}
