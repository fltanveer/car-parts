import type { Metadata } from "next";
import { Suspense } from "react";
import { RequestWizard } from "@/components/request/RequestWizard";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "পার্ট চাই" };

export default function RequestPage() {
  return (
    <Suspense
      fallback={
        <Container className="max-w-xl">
          <div className="h-80 animate-pulse rounded-2xl bg-line/60" />
        </Container>
      }
    >
      <RequestWizard />
    </Suspense>
  );
}
