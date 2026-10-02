import { Suspense } from "react";
import { NewRequestForm } from "@/components/admin/ops/request/NewRequestForm";

export default function NewRequestPage() {
  return (
    <Suspense>
      <NewRequestForm />
    </Suspense>
  );
}
