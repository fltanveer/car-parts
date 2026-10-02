"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useHydrated, useStore } from "@/lib/store";
import { useT } from "../providers/LangProvider";
import { Card, Container } from "../ui/primitives";
import { LoginForm } from "./LoginForm";

// Wrap pages that need a login (orders, chat, claims, account). Shows an
// inline OTP form instead of redirecting, so the user never loses context.
export function RequireLogin({ children, reason }: { children: ReactNode; reason?: string }) {
  const { tx } = useT();
  const hydrated = useHydrated();
  const loggedIn = useStore((s) => !!s.profile);

  if (!hydrated)
    return (
      <Container>
        <div className="h-40 animate-pulse rounded-2xl bg-line/60" />
      </Container>
    );

  if (!loggedIn)
    return (
      <Container className="max-w-md">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent-ink">
              <Lock className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold">{tx("লগইন করুন", "Log in")}</h1>
              <p className="text-sm text-muted">{reason ?? tx("শুধু ফোন নম্বর লাগবে, পাসওয়ার্ড নেই", "Just your phone number, no password")}</p>
            </div>
          </div>
          <LoginForm />
        </Card>
      </Container>
    );

  return <>{children}</>;
}
