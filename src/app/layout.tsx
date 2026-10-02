import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import { cookies } from "next/headers";
import { FloatingActionBar } from "@/components/layout/FloatingActionBar";
import { Header } from "@/components/layout/Header";
import { LangProvider } from "@/components/providers/LangProvider";
import { ServiceWorker } from "@/components/providers/ServiceWorker";
import "./globals.css";

const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "PartsBD · গাড়ির পার্টস, মান লেখা থাকে", template: "%s · PartsBD" },
  description: "ন্যায্য দামে গাড়ির পার্টস। জেনুইন, সমমানের, আফটারমার্কেট, রিকন্ডিশন স্পষ্ট লেখা। না পেলে আমরা এনে দিই।",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1c1917",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = (await cookies()).get("lang")?.value === "en" ? "en" : "bn";
  return (
    <html lang={lang} className={`${hind.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <LangProvider lang={lang}>
          <Header />
          <main className="flex-1 pb-28 pt-4">{children}</main>
          <FloatingActionBar />
        </LangProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
