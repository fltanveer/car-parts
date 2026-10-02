"use client";

import { Camera, ImagePlus, Loader2, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { compressImage, resolveMediaUrl, uploadWithRetry } from "@/lib/blobstore";
import { uid } from "@/lib/store";
import type { MediaItem } from "@/lib/types";
import { useT } from "../providers/LangProvider";

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

export function MediaThumb({ item, onRemove }: { item: MediaItem; onRemove?: () => void }) {
  const { tx } = useT();
  const [url, setUrl] = useState<string | null>(item.url.startsWith("idb:") ? null : item.url);
  useEffect(() => {
    if (item.url.startsWith("idb:")) void resolveMediaUrl(item.url).then(setUrl);
  }, [item.url]);
  return (
    <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
      {url &&
        (item.kind === "video" ? (
          <video src={url} className="size-full object-cover" muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- local blob URL
          <img src={url} alt={item.name} className="size-full object-cover" />
        ))}
      {item.kind === "video" && <Video className="absolute left-1.5 top-1.5 size-4 text-white drop-shadow" />}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={tx("মুছুন", "Remove")}
          className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-ink/80 text-white"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

// Camera or gallery; images compressed to WebP client-side (spec 7.4 / 12).
export function PhotoUploader({
  value,
  onChange,
  allowVideo,
  max = 6,
}: {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  allowVideo?: boolean;
  max?: number;
}) {
  const { tx } = useT();
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const out: MediaItem[] = [];
    for (const f of Array.from(files).slice(0, max - value.length)) {
      const isVideo = f.type.startsWith("video/");
      if (isVideo && !allowVideo) continue;
      if (f.size > (isVideo ? MAX_VIDEO : MAX_IMAGE * 3)) {
        setError(tx("ফাইল অনেক বড়। ছবি ৮MB, ভিডিও ৫০MB পর্যন্ত।", "File too large. Photos up to 8MB, videos 50MB."));
        continue;
      }
      const blob = isVideo ? f : await compressImage(f);
      if (!isVideo && blob.size > MAX_IMAGE) {
        setError(tx("ছবি অনেক বড় (৮MB পর্যন্ত)।", "Photo too large (8MB max)."));
        continue;
      }
      const id = uid();
      const url = await uploadWithRetry(id, blob);
      out.push({ id, url, kind: isVideo ? "video" : "image", name: f.name });
    }
    onChange([...value, ...out]);
    setBusy(false);
    if (cam.current) cam.current.value = "";
    if (gal.current) gal.current.value = "";
  };

  const accept = allowVideo ? "image/*,video/*" : "image/*";
  const full = value.length >= max;

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {value.map((m) => (
            <MediaThumb key={m.id} item={m} onRemove={() => onChange(value.filter((x) => x.id !== m.id))} />
          ))}
        </div>
      )}
      {!full && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cam.current?.click()}
            disabled={busy}
            className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-ink/25 bg-card font-semibold hover:border-ink/50"
          >
            {busy ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
            {tx("ক্যামেরা", "Camera")}
          </button>
          <button
            type="button"
            onClick={() => gal.current?.click()}
            disabled={busy}
            className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-ink/25 bg-card font-semibold hover:border-ink/50"
          >
            <ImagePlus className="size-6" />
            {tx("গ্যালারি থেকে", "From gallery")}
          </button>
        </div>
      )}
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      <input ref={cam} type="file" accept={accept} capture="environment" hidden onChange={(e) => void add(e.target.files)} />
      <input ref={gal} type="file" accept={accept} multiple hidden onChange={(e) => void add(e.target.files)} />
    </div>
  );
}
