"use client";

import clsx from "clsx";
import { Check, Loader2, Mic, MicOff, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { settings } from "@/lib/mock/settings";
import { uploadWithRetry } from "@/lib/blobstore";
import { markSeenVoiceNotice } from "@/lib/db/actions";
import { uid } from "@/lib/db/seed";
import { getDb } from "@/lib/db/store";
import type { VoiceNote } from "@/lib/types";
import { useT } from "../providers/LangProvider";
import { Button } from "../ui/primitives";
import { VoicePlayer } from "./VoicePlayer";

const now = () => Date.now();

type Phase = "idle" | "explain" | "denied" | "recording" | "review" | "uploading";

const pickMime = () => {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"]) if (MediaRecorder.isTypeSupported(m)) return m;
  return "";
};

// Spec 7.4: tap to start, tap to stop (not hold). Max 120s with warning at 100s.
export function VoiceRecorder({
  onSaved,
  compact,
  sendLabel,
}: {
  onSaved: (v: VoiceNote) => void;
  compact?: boolean;
  sendLabel?: string;
}) {
  const { tx, d } = useT();
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(0);

  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const raf = useRef<number | null>(null);
  const started = useRef(0);
  // A finished-but-unsent recording is saved anyway if the component unmounts
  // (e.g. the user taps "next" without pressing keep), so nothing is lost.
  const pending = useRef<{ blob: Blob; seconds: number } | null>(null);
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  });
  useEffect(
    () => () => {
      const p = pending.current;
      if (!p) return;
      const id = uid();
      void uploadWithRetry(id, p.blob).then((url) =>
        onSavedRef.current({ id, url, mime_type: p.blob.type, duration_sec: Math.max(1, p.seconds), size_bytes: p.blob.size }),
      );
    },
    [],
  );

  const cleanup = () => {
    if (timer.current) clearInterval(timer.current);
    if (raf.current) cancelAnimationFrame(raf.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => cleanup, []);
  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl]);

  const unsupported = typeof window !== "undefined" && (pickMime() === null || !navigator.mediaDevices?.getUserMedia);

  const begin = () => {
    // Privacy notice + mic explanation before first permission prompt (spec 7.4, 9.6).
    if (!getDb().seenVoiceNotice) setPhase("explain");
    else void start();
  };

  const start = async () => {
    markSeenVoiceNotice();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime() || undefined;
      const rec = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32000 });
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        const b = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        setBlob(b);
        pending.current = { blob: b, seconds: Math.floor((now() - started.current) / 1000) };
        setPreviewUrl(URL.createObjectURL(b));
        setPhase("review");
        cleanup();
      };
      recRef.current = rec;
      rec.start(250);
      started.current = now();
      setSeconds(0);
      setPhase("recording");

      timer.current = setInterval(() => {
        const s = Math.floor((now() - started.current) / 1000);
        setSeconds(s);
        if (s >= settings.max_voice_seconds) stop();
      }, 250);

      // Sound level bar.
      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        an.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
        setLevel(Math.min(1, peak / 64));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setPhase("denied");
    }
  };

  const stop = () => {
    if (recRef.current?.state === "recording") recRef.current.stop();
  };

  const redo = () => {
    pending.current = null;
    setBlob(null);
    setPreviewUrl(null);
    setPhase("idle");
  };

  const send = async () => {
    if (!blob) return;
    setPhase("uploading");
    pending.current = null;
    const id = uid();
    const url = await uploadWithRetry(id, blob, (a) => setRetrying(a));
    setRetrying(0);
    onSaved({ id, url, mime_type: blob.type, duration_sec: Math.max(1, seconds), size_bytes: blob.size });
    setBlob(null);
    setPreviewUrl(null);
    setPhase("idle");
  };

  const mmss = (s: number) => d(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);

  if (unsupported)
    return (
      <p className="rounded-xl bg-surface p-4 text-sm text-muted">
        {tx("এই ব্রাউজারে রেকর্ড করা যাচ্ছে না। ছবি দিন বা কল করুন।", "Recording isn't supported in this browser. Send a photo or call us.")}
      </p>
    );

  if (phase === "explain")
    return (
      <div className="space-y-3 rounded-2xl border border-line bg-card p-4">
        <p className="font-semibold">{tx("আপনার কথা রেকর্ড করতে মাইক চালু করতে হবে।", "We need your microphone to record.")}</p>
        <p className="text-sm text-muted">
          {tx(
            "পরের বার্তায় 'Allow' চাপুন। আপনার ভয়েস রেকর্ড সঠিক পার্ট খুঁজতে ও বিরোধ মেটাতে সংরক্ষণ করা হয়।",
            "Tap 'Allow' on the next prompt. Voice recordings are kept to find the right part and settle disputes.",
          )}
        </p>
        <Button variant="primary" size="lg" full onClick={() => void start()}>
          <Mic className="size-5" /> {tx("ঠিক আছে, মাইক চালু করুন", "OK, turn on mic")}
        </Button>
      </div>
    );

  if (phase === "denied")
    return (
      <div className="space-y-3 rounded-2xl border border-bad/30 bg-bad/5 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-bad">
          <MicOff className="size-5" /> {tx("মাইক চালু করা যায়নি", "Microphone blocked")}
        </p>
        <p>{tx("ব্রাউজারের সেটিংসে মাইক অনুমতি দিন, অথবা ছবি দিন / কল করুন।", "Allow the mic in browser settings, or send a photo / call us.")}</p>
        <Button variant="outline" onClick={() => setPhase("idle")}>
          {tx("আবার চেষ্টা", "Try again")}
        </Button>
      </div>
    );

  if (phase === "review" || phase === "uploading")
    return (
      <div className="space-y-3 rounded-2xl border border-line bg-card p-4">
        {previewUrl && <VoicePlayer src={previewUrl} duration={seconds} />}
        {retrying > 0 && (
          <p className="text-sm font-medium text-wait">{tx("নেট ধীর, আবার চেষ্টা করছি…", "Slow network, retrying…")}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={redo} disabled={phase === "uploading"}>
            <RotateCcw className="size-5" /> {tx("আবার রেকর্ড", "Re-record")}
          </Button>
          <Button variant="primary" size="lg" onClick={() => void send()} disabled={phase === "uploading"}>
            {phase === "uploading" ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
            {sendLabel ?? tx("রাখুন", "Use this")}
          </Button>
        </div>
      </div>
    );

  const recording = phase === "recording";
  const warn = seconds >= settings.voice_warn_seconds;

  return (
    <div className={clsx("flex flex-col items-center gap-3", compact ? "py-2" : "py-6")}>
      <button
        type="button"
        onClick={recording ? stop : begin}
        aria-label={recording ? tx("রেকর্ড শেষ করুন", "Stop recording") : tx("রেকর্ড শুরু করুন", "Start recording")}
        className={clsx(
          "grid place-items-center rounded-full text-white shadow-lg transition-transform active:scale-95",
          compact ? "size-20" : "size-28",
          recording ? "recording-pulse bg-bad" : "bg-bad hover:brightness-110",
        )}
      >
        {recording ? <Square className={compact ? "size-8" : "size-10"} fill="currentColor" /> : <Mic className={compact ? "size-9" : "size-12"} />}
      </button>
      {recording ? (
        <>
          <p className={clsx("text-2xl font-bold tabular-nums", warn && "text-bad")}>
            {mmss(seconds)} <span className="text-base font-normal text-muted">/ {mmss(settings.max_voice_seconds)}</span>
          </p>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-bad transition-[width] duration-75" style={{ width: `${Math.max(6, level * 100)}%` }} />
          </div>
          <p className="text-sm font-medium">
            {warn ? tx("সময় প্রায় শেষ, কথা শেষ করুন", "Almost out of time") : tx("বলা শেষ হলে আবার চাপুন", "Tap again when done")}
          </p>
        </>
      ) : (
        <p className="text-center font-semibold">
          {tx("চাপ দিন, তারপর বলুন", "Tap, then speak")}
          <span className="block text-sm font-normal text-muted">
            {tx("গাড়ির নাম, সাল আর কোন পার্ট লাগবে বলুন", "Say your car, year and which part you need")}
          </span>
        </p>
      )}
    </div>
  );
}
