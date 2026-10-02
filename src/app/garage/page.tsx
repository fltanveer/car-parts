import type { Metadata } from "next";
import { GarageList } from "@/components/garage/GarageList";

export const metadata: Metadata = { title: "আমার গাড়ি" };

export default function GaragePage() {
  return <GarageList />;
}
