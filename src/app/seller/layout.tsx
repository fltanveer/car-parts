import type { Metadata } from "next";
import { SellerShell } from "@/components/layout/SellerShell";

export const metadata: Metadata = { title: { default: "বিক্রেতা প্যানেল", template: "%s · বিক্রেতা · GaariHub" } };

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerShell>{children}</SellerShell>;
}
