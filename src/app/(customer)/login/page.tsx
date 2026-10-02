import { Suspense } from "react";
import { LoginFlow } from "@/components/customer/my/LoginFlow";

export const metadata = { title: "লগইন" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-md animate-pulse" />}>
      <LoginFlow />
    </Suspense>
  );
}
