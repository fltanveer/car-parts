import { Suspense } from "react";
import { RequestWizard } from "@/components/customer/my/RequestWizard";

export const metadata = { title: "পার্ট চাই" };

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-3xl animate-pulse" />}>
      <RequestWizard />
    </Suspense>
  );
}
