import type { Metadata } from "next";
import { AccountScreen } from "@/components/account/AccountScreen";
import { RequireLogin } from "@/components/auth/RequireLogin";

export const metadata: Metadata = { title: "অ্যাকাউন্ট" };

export default function AccountPage() {
  return (
    <RequireLogin>
      <AccountScreen />
    </RequireLogin>
  );
}
