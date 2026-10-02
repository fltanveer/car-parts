import type { Metadata } from "next";
import { RequestDetail } from "@/components/request/RequestDetail";

export const metadata: Metadata = { title: "রিকোয়েস্টের অবস্থা" };

export default async function RequestStatusPage(props: PageProps<"/request/[id]">) {
  const { id } = await props.params;
  return <RequestDetail id={id} />;
}
