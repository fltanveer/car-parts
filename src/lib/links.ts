import { settings } from "./mock/settings";

export const telLink = () => `tel:${settings.hotline}`;

export const waLink = (text?: string) =>
  `https://wa.me/${settings.whatsapp_number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const siteUrl = (path: string) =>
  (typeof window !== "undefined" ? window.location.origin : "https://partsbd.example") + path;
