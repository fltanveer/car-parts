import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import { cookies } from "next/headers";
import { LangProvider } from "@/components/providers/LangProvider";
import { ServiceWorker } from "@/components/providers/ServiceWorker";
import { Toaster } from "@/components/shared/Misc";
import "./globals.css";

const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "GaariHub · গাড়ির সব কিছু এক অ্যাপে", template: "%s · GaariHub" },
  description: "যাচাইকৃত দোকান থেকে গাড়ির পার্টস। দাম তুলনা করুন, পার্ট চাইলে দোকানগুলো দাম দেবে, টাকা নিরাপদ।",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0e7490",
  width: "device-width",
  initialScale: 1,
};

// One root layout; the customer app, /seller and /admin each add their own shell.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = (await cookies()).get("lang")?.value === "en" ? "en" : "bn";
  return (
    <html lang={lang} className={`${hind.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <LangProvider lang={lang}>
          {children}
          <Toaster />
        </LangProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
