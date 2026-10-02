"use client";

import { useState } from "react";
import { useT } from "../../providers/LangProvider";
import { Button, Notice } from "../../ui/primitives";

/** "I'm at the shop now" → browser GPS; falls back to the market pin (file 02 §3 step 4). */
export function GpsButton({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  const { tx, d } = useT();
  const [state, setState] = useState<"idle" | "busy" | "ok" | "fail">("idle");
  const locate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("fail");
      return;
    }
    setState("busy");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        onChange(Number(p.coords.latitude.toFixed(5)), Number(p.coords.longitude.toFixed(5)));
        setState("ok");
      },
      () => setState("fail"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };
  return (
    <div className="space-y-2">
      <Button variant="brand" size="lg" full onClick={locate} disabled={state === "busy"}>
        📍 {state === "busy" ? tx("খুঁজছি…", "Locating…") : tx("আমি এখন দোকানে আছি", "I'm at the shop now")}
      </Button>
      {state === "ok" && <Notice tone="ok">✅ {tx("লোকেশন পাওয়া গেছে", "Location found")}</Notice>}
      {state === "fail" && <Notice tone="wait">{tx("লোকেশন পাওয়া যায়নি। বাজারের জায়গা ধরা হবে, মাঠকর্মী পরে ঠিক করে দেবে।", "Couldn't get location. We'll use the market location; a field agent will fix it later.")}</Notice>}
      <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`} target="_blank" rel="noreferrer" className="block text-sm font-semibold text-brand underline">
        🗺️ {tx("ম্যাপে দেখুন", "See on map")} ({d(lat.toFixed(4))}, {d(lng.toFixed(4))})
      </a>
    </div>
  );
}
