import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GaariHub · গাড়ির সব কিছু",
    short_name: "GaariHub",
    description: "যাচাইকৃত দোকান থেকে গাড়ির পার্টস, দাম তুলনা, আমার গাড়ি",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#0e7490",
    lang: "bn",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
