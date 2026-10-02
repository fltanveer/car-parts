"use client";

import { useState } from "react";

// Time captured once on mount. These screens only render after hydration
// (store-backed), so there's no server/client mismatch.
export function useNow() {
  const [now] = useState(() => Date.now());
  return now;
}
