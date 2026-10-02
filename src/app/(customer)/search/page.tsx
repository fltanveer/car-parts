import { Suspense } from "react";
import { SearchView } from "./SearchView";

export const metadata = { title: "খুঁজুন" };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-40 max-w-3xl animate-pulse rounded-2xl bg-card" />}>
      <SearchView />
    </Suspense>
  );
}
