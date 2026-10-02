"use client";

import { JoinFlow } from "@/components/seller/join/JoinFlow";
import { Container } from "@/components/ui/primitives";
import { useHydrated } from "@/lib/db/store";

// Onboarding is open to everyone (no seller session needed); the draft lives in localStorage.
export default function Page() {
  const hydrated = useHydrated();
  if (!hydrated) return <Container><div className="h-64 animate-pulse rounded-2xl bg-card" /></Container>;
  return <JoinFlow />;
}
