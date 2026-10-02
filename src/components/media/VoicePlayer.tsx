"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { resolveMediaUrl } from "@/lib/blobstore";
import { useT } from "../providers/LangProvider";

// Plays a voice note. Accepts "idb:<id>" (mock storage) or a normal URL.
export function VoicePlayer({ src, duration, dark }: { src: string; duration: number; dark?: boolean }) {
  const { d, tx } = useT();
  const [url, setUrl] = useState<string | null>(src.startsWith("idb:") ? null : src);
  const [missing, setMissing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!src.startsWith("idb:")) return;
    let live = true;
    void resolveMediaUrl(src).then((u) => {
      if (!live) return;
      if (u) setUrl(u);
      else setMissing(true);
    });
    return () => {
      live = false;
    };
  }, [src]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  const mmss = (s: number) => d(`${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`);

  if (missing) return <p className="text-sm text-muted">{tx("ভয়েস ফাইল পাওয়া যায়নি", "Voice file unavailable")}</p>;

  const pct = duration ? Math.min(100, (pos / duration) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={!url}
        aria-label={playing ? tx("থামান", "Pause") : tx("শুনুন", "Play")}
        className={`grid size-11 shrink-0 place-items-center rounded-full ${dark ? "bg-white text-ink" : "bg-ink text-white"}`}
      >
        {playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5 translate-x-px" fill="currentColor" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={`h-1.5 overflow-hidden rounded-full ${dark ? "bg-white/30" : "bg-line"}`}>
          <div className={`h-full ${dark ? "bg-white" : "bg-ink"}`} style={{ width: `${pct}%` }} />
        </div>
        <p className={`mt-1 text-xs tabular-nums ${dark ? "text-white/70" : "text-muted"}`}>
          {mmss(pos)} / {mmss(duration)}
        </p>
      </div>
      {url && (
        <audio
          ref={audio}
          src={url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setPos(0);
          }}
          onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        />
      )}
    </div>
  );
}
