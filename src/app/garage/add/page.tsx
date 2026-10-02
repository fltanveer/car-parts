import type { Metadata } from "next";
import { AddVehicle } from "@/components/garage/AddVehicle";
import { safeNext } from "@/components/garage/safeNext";

export const metadata: Metadata = { title: "গাড়ি যোগ করুন" };

export default async function AddVehiclePage(props: PageProps<"/garage/add">) {
  const sp = await props.searchParams;
  return <AddVehicle next={safeNext(sp.next)} />;
}
