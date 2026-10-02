"use client";

import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/blobstore";
import type { MediaItem } from "@/lib/types";
import { useT } from "../../providers/LangProvider";
import { Notice } from "../../ui/primitives";

/** Average brightness (0–255) and a crude sharpness estimate on a tiny canvas. */
const analyse = (src: string) =>
  new Promise<{ dark: boolean; blurry: boolean } | null>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const n = 48;
        const c = document.createElement("canvas");
        c.width = n;
        c.height = n;
        const ctx = c.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, n, n);
        const px = ctx.getImageData(0, 0, n, n).data;
        let sum = 0;
        let edges = 0;
        const lum: number[] = [];
        for (let i = 0; i < px.length; i += 4) lum.push(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
        lum.forEach((l, i) => {
          sum += l;
          if (i % n < n - 1) edges += Math.abs(l - lum[i + 1]);
        });
        resolve({ dark: sum / lum.length < 55, blurry: edges / lum.length < 3 });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

/** Warns when the latest photo looks dark or blurry (file 04 §7). Stub-level heuristic. */
export function PhotoCheck({ photos }: { photos: MediaItem[] }) {
  const { tx } = useT();
  const [result, setResult] = useState<{ id: string; dark: boolean; blurry: boolean } | null>(null);
  const last = photos[photos.length - 1];
  useEffect(() => {
    if (!last || last.kind !== "image" || last.url.startsWith("ph:")) return;
    let live = true;
    void resolveMediaUrl(last.url).then(async (u) => {
      if (!u) return;
      const r = await analyse(u);
      if (live && r) setResult({ id: last.id, ...r });
    });
    return () => {
      live = false;
    };
  }, [last]);
  if (!last || !result || result.id !== last.id) return null;
  if (result.dark) return <Notice tone="wait">🌙 {tx("ছবি অন্ধকার। আরেকটু আলোতে তুলুন।", "Photo is dark. Take it in more light.")}</Notice>;
  if (result.blurry) return <Notice tone="wait">🌫️ {tx("ছবি ঝাপসা মনে হচ্ছে। ফোন স্থির রেখে আবার তুলুন।", "Photo looks blurry. Hold steady and retake.")}</Notice>;
  return <Notice tone="ok">✅ {tx("ছবি পরিষ্কার", "Photo looks good")}</Notice>;
}
