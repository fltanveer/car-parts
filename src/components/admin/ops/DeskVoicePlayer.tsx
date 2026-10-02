"use client";

import clsx from "clsx";
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { resolveMediaUrl } from "@/lib/blobstore";

const SPEEDS = [0.75, 1, 1.25, 1.5];

/**
 * Request-desk audio player (file 03 6.2): speed 0.75–1.5x, ±5 s, keyboard
 * shortcuts when focused (Space play/pause, ←/→ 5 s, ↑/↓ speed).
 */
export function DeskVoicePlayer({ src, duration }: { src: string; duration: number }) {
  const { tx, d } = useT();
  const [url, setUrl] = useState<string | null>(src && !src.startsWith("idb:") ? src : null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!src.startsWith("idb:")) return;
    let live = true;
    void resolveMediaUrl(src).then((u) => {
      if (live) setUrl(u || null);
    });
    return () => {
      live = false;
    };
  }, [src]);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed;
  }, [speed, url]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };
  const seek = (delta: number) => {
    const a = audio.current;
    if (a) a.currentTime = Math.max(0, Math.min((a.duration || duration) - 0.1, a.currentTime + delta));
  };
  const bump = (dir: 1 | -1) => setSpeed((s) => SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, SPEEDS.indexOf(s) + dir))]);
  const mmss = (s: number) => d(`${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`);
  const pct = duration ? Math.min(100, (pos / duration) * 100) : 0;

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        const k = { " ": toggle, ArrowLeft: () => seek(-5), ArrowRight: () => seek(5), ArrowUp: () => bump(1), ArrowDown: () => bump(-1) }[e.key];
        if (k) {
          e.preventDefault();
          k();
        }
      }}
      className="rounded-2xl bg-ink p-3 text-white outline-none focus-visible:ring-4 focus-visible:ring-brand/50"
      aria-label={tx("ভয়েস প্লেয়ার (Space, ←, →, ↑, ↓)", "Voice player (Space, ←, →, ↑, ↓)")}
    >
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => seek(-5)} disabled={!url} className="grid size-10 place-items-center rounded-full hover:bg-white/10 disabled:opacity-40" aria-label={tx("৫ সেকেন্ড পিছনে", "Back 5 s")}>
          <RotateCcw className="size-5" />
        </button>
        <button type="button" onClick={toggle} disabled={!url} className="grid size-12 place-items-center rounded-full bg-white text-ink disabled:opacity-40" aria-label={playing ? tx("থামান", "Pause") : tx("চালান", "Play")}>
          {playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5 translate-x-px" fill="currentColor" />}
        </button>
        <button type="button" onClick={() => seek(5)} disabled={!url} className="grid size-10 place-items-center rounded-full hover:bg-white/10 disabled:opacity-40" aria-label={tx("৫ সেকেন্ড সামনে", "Forward 5 s")}>
          <RotateCw className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
            <div className="h-full bg-white" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs tabular-nums text-white/70">
            {mmss(pos)} / {mmss(duration)}
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {SPEEDS.map((s) => (
          <button key={s} type="button" onClick={() => setSpeed(s)} aria-pressed={speed === s} className={clsx("min-h-8 rounded-lg px-2.5 text-xs font-bold", speed === s ? "bg-white text-ink" : "bg-white/10 hover:bg-white/20")}>
            {d(s)}x
          </button>
        ))}
      </div>
      {!url && <p className="mt-2 text-xs text-white/70">{tx("ডেমো: এই রিকোয়েস্টে আসল অডিও ফাইল নেই।", "Demo: no real audio file on this request.")}</p>}
      {url && (
        <audio
          ref={audio}
          src={url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        />
      )}
    </div>
  );
}
