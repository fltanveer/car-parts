import { Suspense } from "react";
import { RequestBoard } from "@/components/admin/ops/RequestBoard";

export default function RequestsPage() {
  return (
    <Suspense>
      <RequestBoard />
    </Suspense>
  );
}
