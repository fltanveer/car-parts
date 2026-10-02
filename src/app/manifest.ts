import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PartsBD · গাড়ির পার্টস",
    short_name: "PartsBD",
    description: "ন্যায্য দামে গাড়ির পার্টস, মান লেখা থাকে",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f4",
    theme_color: "#1c1917",
    lang: "bn",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
