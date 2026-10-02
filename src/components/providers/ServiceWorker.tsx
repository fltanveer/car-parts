"use client";

import { useEffect } from "react";

// Registers the PWA service worker in production only (spec 5: installable, offline fallback).
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
