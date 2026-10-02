"use client";

import clsx from "clsx";
import { ArrowLeft, ArrowRight, ChevronLeft, LogIn, Phone, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPartById, settings } from "@/lib/api";
import { displayPhone, normalizePhone } from "@/lib/format";
import { telLink } from "@/lib/links";
import { addVehicle, createRequest, guestRequestsToday, useStore } from "@/lib/store";
import type { Lang, PartRequest } from "@/lib/types";
import { LoginForm } from "../auth/LoginForm";
import { AudioGuide } from "../layout/AudioGuide";
import { useT } from "../providers/LangProvider";
import { Button, Container, Notice } from "../ui/primitives";
import { type Draft, hasInput, type InputKind, resolveVehicle, type VehicleSel } from "./draft";
import { RequestSent } from "./RequestSent";
import { Sheet } from "./Sheet";
import { StepContact } from "./StepContact";
import { StepHow } from "./StepHow";
import { StepQuality } from "./StepQuality";
import { StepReview } from "./StepReview";
import { StepVehicle } from "./StepVehicle";

const TOTAL = 5;

const prefillText = (sp: URLSearchParams, lang: Lang) => {
  const parts: string[] = [];
  const partId = sp.get("part");
  const p = partId ? getPartById(partId) : null;
  if (p) parts.push(`${lang === "bn" ? p.name_bn : p.name} (${p.part_number})`);
  const q = sp.get("q")?.trim();
  if (q) parts.push(q);
  return parts.join(", ");
};

// Spec 7.8: the 5-step "I need a part" wizard. Step lives in ?step= via the
// native history API, so the phone's back button walks back through steps.
export function RequestWizard() {
  const sp = useSearchParams();
  const { tx, lang, d } = useT();
  const vehicles = useStore((s) => s.vehicles);
  const activeId = useStore((s) => s.activeVehicleId);
  const profile = useStore((s) => s.profile);

  const [draft, setDraft] = useState<Draft>(() => ({
    voices: [],
    photos: [],
    text: prefillText(new URLSearchParams(sp.toString()), lang),
    vehicle: undefined,
    qualities: [],
    phone: null,
    name: "",
    contact: "call",
    callTime: "any",
  }));
  const [open, setOpenMap] = useState<Record<InputKind, boolean>>(() => {
    const mode = sp.get("mode");
    const prefilled = !!(sp.get("q") || sp.get("part"));
    return { voice: mode === "voice", photo: mode === "photo", text: mode === "text" || prefilled };
  });
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [sent, setSent] = useState<{ req: PartRequest; phone: string } | null>(null);

  const patch = (p: Partial<Draft>) => setDraft((cur) => ({ ...cur, ...p }));
  const filled = hasInput(draft);
  const urlStep = Math.min(TOTAL, Math.max(1, Number(sp.get("step")) || 1));
  // Nothing entered yet (e.g. page reloaded mid-way): always start at step 1.
  const step = filled ? urlStep : 1;

  const activeSel: VehicleSel | null = activeId && vehicles.some((v) => v.id === activeId) ? { kind: "saved", vehicleId: activeId } : null;
  const vehicleSel = draft.vehicle === undefined ? activeSel : draft.vehicle;
  const phone = draft.phone ?? (profile ? displayPhone(profile.phone) : "");

  const stepUrl = (n: number) => {
    const params = new URLSearchParams(sp.toString());
    if (n <= 1) params.delete("step");
    else params.set("step", String(n));
    const qs = params.toString();
    return qs ? `?${qs}` : window.location.pathname;
  };

  useEffect(() => {
    if (urlStep === step) return;
    const params = new URLSearchParams(sp.toString());
    params.delete("step");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [urlStep, step, sp]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // Invariant: exactly (step - 1) history entries sit above step 1.
  const goBackTo = (n: number) => {
    setError(null);
    if (step > n) window.history.go(n - step);
  };

  const next = () => {
    setError(null);
    if (step === 1 && !filled) {
      setError(tx("অন্তত একটা দিন: 🎤 ভয়েস, 📷 ছবি অথবা ✍️ লেখা", "Add at least one: 🎤 voice, 📷 photo or ✍️ text"));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (step === 4) {
      const e164 = normalizePhone(phone);
      if (!e164) {
        setPhoneError(tx("সঠিক মোবাইল নম্বর দিন (যেমন 01711-000000)", "Enter a valid mobile number (e.g. 01711-000000)"));
        return;
      }
      if (!profile && guestRequestsToday(e164) >= settings.guest_requests_per_day) {
        setRateLimited(true);
        return;
      }
    }
    if (step === TOTAL) return submit();
    window.history.pushState(null, "", stepUrl(step + 1));
  };

  const submit = () => {
    const e164 = normalizePhone(phone);
    if (!e164) return goBackTo(4);
    const v = resolveVehicle(vehicleSel, vehicles, lang);
    const res = createRequest({
      phone: e164,
      contact_name: draft.name.trim() || null,
      vehicle_generation_id: v.generation_id,
      vehicle_text: v.vehicle_text,
      description_text: draft.text.trim() || null,
      voice_notes: draft.voices,
      photos: draft.photos,
      preferred_qualities: draft.qualities.length ? draft.qualities : null,
      preferred_contact: draft.contact,
      preferred_call_time: draft.callTime,
    });
    if ("error" in res) {
      setRateLimited(true);
      return;
    }
    if (vehicleSel && (vehicleSel.kind === "picked" || vehicleSel.kind === "chassis") && vehicleSel.save && vehicleSel.generation_id) {
      addVehicle({
        generation_id: vehicleSel.generation_id,
        engine_id: vehicleSel.kind === "picked" ? vehicleSel.engine_id : null,
        chassis_number: vehicleSel.kind === "chassis" ? vehicleSel.chassis_number : null,
        nickname: null,
        registration_doc_url: null,
        needs_admin_setup: false,
      });
    }
    setSent({ req: res, phone: e164 });
    // Collapse the wizard's history entries so "back" leaves the page.
    if (step > 1) window.history.go(1 - step);
  };

  if (sent) return <RequestSent request={sent.req} phone={sent.phone} />;

  const titles = [
    tx("কীভাবে বলবেন?", "How will you tell us?"),
    tx("কোন গাড়ি?", "Which car?"),
    tx("কোন মান চান?", "Which quality?"),
    tx("আপনার সাথে যোগাযোগ", "How to reach you"),
    tx("দেখে নিন, তারপর পাঠান", "Check and send"),
  ];
  const guides = [
    tx(
      "কোন পার্ট লাগবে আমাদের জানান। লাল মাইক চেপে বলে দিন, অথবা পার্টের ছবি দিন, অথবা লিখে দিন। যেকোনো একটা দিলেই হবে।",
      "Tell us which part you need. Tap the red mic and speak, or send a photo, or type it. Any one is enough.",
    ),
    tx(
      "আপনার গাড়ি কোনটা বেছে নিন। না জানলে 'জানি না' চাপুন, কোনো সমস্যা নেই। তারপর নিচের 'পরের ধাপ' চাপুন।",
      "Choose your car. If you're not sure, tap 'Not sure', that's fine. Then tap 'Next' below.",
    ),
    tx(
      "কোন মানের পার্ট চান বেছে নিন। না বুঝলে 'আপনারা সাজেস্ট করুন' রেখে দিন, আমরা কয়েকটা দাম জানাবো।",
      "Pick the quality you want. If unsure, keep 'You suggest' and we'll quote a few options.",
    ),
    tx(
      "আপনার মোবাইল নম্বর দিন। এই নম্বরে ফোন করে আমরা দাম জানাবো। লগইন লাগবে না।",
      "Enter your mobile number. We'll call it with the price. No login needed.",
    ),
    tx("সব ঠিক আছে কিনা দেখে নিন। তারপর নিচের সবুজ 'রিকোয়েস্ট পাঠান' বাটন চাপুন।", "Check everything, then tap the 'Send request' button below."),
  ];

  const nextLabel =
    step === TOTAL
      ? tx("রিকোয়েস্ট পাঠান", "Send request")
      : step === 2 && !vehicleSel
        ? tx("এড়িয়ে যান", "Skip")
        : tx("পরের ধাপ", "Next");

  return (
    <>
      <Container className="max-w-xl">
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => goBackTo(step - 1)}
                aria-label={tx("আগের ধাপে যান", "Previous step")}
                className="-ml-2 grid size-11 place-items-center rounded-full hover:bg-ink/5"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}
            <p className="text-sm font-semibold text-muted">
              {tx(`ধাপ ${d(step)} / ${d(TOTAL)}`, `Step ${step} of ${TOTAL}`)}
            </p>
          </div>
          <div className="flex gap-1.5" aria-hidden>
            {Array.from({ length: TOTAL }, (_, i) => (
              <span key={i} className={clsx("h-2 flex-1 rounded-full transition-colors", i < step ? "bg-ink" : "bg-line")} />
            ))}
          </div>
          <h1 className="mt-4 text-3xl font-bold">
            {titles[step - 1]}
            {step === 3 && <span className="ml-2 text-base font-normal text-muted">({tx("ঐচ্ছিক", "optional")})</span>}
          </h1>
          <AudioGuide key={step} className="mt-3" text={guides[step - 1]} />
        </div>

        {error && (
          <Notice tone="danger" className="mb-4 text-base font-semibold">
            <span role="alert">{error}</span>
          </Notice>
        )}

        {step === 1 && (
          <StepHow
            voices={draft.voices}
            photos={draft.photos}
            text={draft.text}
            open={open}
            setOpen={(k, v) => setOpenMap((o) => ({ ...o, [k]: v }))}
            onVoices={(voices) => {
              patch({ voices });
              setError(null);
            }}
            onPhotos={(photos) => {
              patch({ photos });
              setError(null);
            }}
            onText={(text) => {
              patch({ text });
              setError(null);
            }}
          />
        )}

        {step === 2 && (
          <StepVehicle vehicles={vehicles} value={vehicleSel} onChange={(vehicle) => patch({ vehicle })} hasVoice={draft.voices.length > 0} />
        )}

        {step === 3 && <StepQuality value={draft.qualities} onChange={(qualities) => patch({ qualities })} />}

        {step === 4 && (
          <StepContact
            phone={phone}
            onPhone={(p) => {
              patch({ phone: p });
              setPhoneError(null);
              setRateLimited(false);
            }}
            phoneError={phoneError}
            loggedIn={!!profile}
            name={draft.name}
            onName={(name) => patch({ name })}
            contact={draft.contact}
            onContact={(contact) => patch({ contact })}
            callTime={draft.callTime}
            onCallTime={(callTime) => patch({ callTime })}
          />
        )}

        {step === 5 && (
          <StepReview
            voices={draft.voices}
            photos={draft.photos}
            text={draft.text}
            vehicleLabel={resolveVehicle(vehicleSel, vehicles, lang).label}
            qualities={draft.qualities}
            phone={normalizePhone(phone) ?? phone}
            name={draft.name}
            contact={draft.contact}
            callTime={draft.callTime}
            onEdit={goBackTo}
          />
        )}

        {rateLimited && !profile && (step === 4 || step === 5) && (
          <div className="mt-5 space-y-3 rounded-2xl border-2 border-danger/30 bg-danger/5 p-4" role="alert">
            <p className="font-bold text-danger">
              {tx(
                `এই নম্বর থেকে আজ ${d(settings.guest_requests_per_day)}টা রিকোয়েস্ট দেওয়া হয়ে গেছে`,
                `This number has already sent ${settings.guest_requests_per_day} requests today`,
              )}
            </p>
            <p className="text-sm">
              {tx(
                "আরও পার্ট লাগলে সরাসরি ফোন করুন, অথবা লগইন করে পাঠান। লগইন করলে এই সীমা থাকে না।",
                "Need more parts? Call us directly, or log in to send. Logged-in users have no daily limit.",
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a href={telLink()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-q-oem px-4 font-semibold text-white">
                <Phone className="size-5" /> {tx("কল করুন", "Call us")}
              </a>
              <Button variant="outline" onClick={() => setLoginOpen(true)}>
                <LogIn className="size-5" /> {tx("লগইন করুন", "Log in")}
              </Button>
            </div>
          </div>
        )}
      </Container>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <Container className="flex max-w-xl gap-2 py-3">
          {step > 1 && (
            <Button variant="outline" size="lg" onClick={() => goBackTo(step - 1)} className="shrink-0 px-4">
              <ArrowLeft className="size-5" /> {tx("পেছনে", "Back")}
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={next}
            className={clsx("flex-1", step === TOTAL && "bg-ok hover:bg-ok hover:brightness-110")}
          >
            {step === TOTAL && <Send className="size-5" />}
            {nextLabel}
            {step < TOTAL && <ArrowRight className="size-5" />}
          </Button>
        </Container>
      </div>

      <Sheet open={loginOpen} onClose={() => setLoginOpen(false)} title={tx("লগইন করুন", "Log in")}>
        <LoginForm
          initialPhone={phone}
          onDone={() => {
            setLoginOpen(false);
            setRateLimited(false);
          }}
        />
      </Sheet>
    </>
  );
}
