"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createRequest } from "@/lib/db/actions";
import { getDb, useDb, useHydrated } from "@/lib/db/store";
import { normalizePhone } from "@/lib/format";
import type { PartRequest } from "@/lib/types";
import { AudioGuide, SpeakButton } from "../../layout/AudioGuide";
import { BackButton, HelpCall, toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, ButtonLink, Card, Container } from "../../ui/primitives";
import { getGuestPhone, setGuestPhone } from "./customerActions";
import { StepHow, StepVehicle } from "./WizardStepsA";
import { StepContact, StepQuality, StepReview, contactError } from "./WizardStepsB";
import { clearDraft, emptyDraft, hasWhat, loadDraft, saveDraft, type Draft } from "./wizardDraft";

/** /request: 5-step "part chai" wizard (file 01 §5.1). Reads ?mode= and ?q=. */
export function RequestWizard() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  if (!hydrated) return <Container className="h-96 animate-pulse" />;
  return <Wizard mode={params.get("mode")} q={params.get("q")} vehicle={params.get("vehicle")} />;
}

const prefill = (d: Draft, vehicleId: string | null = null): Draft => {
  const s = getDb();
  const phone = s.session.customerPhone;
  const out = { ...d };
  // ?vehicle=<userVehicleId> from search/product pages preselects that car.
  const wanted = vehicleId ? s.vehicles.find((v) => v.id === vehicleId && v.owner === (phone ?? "guest")) : null;
  if (wanted) Object.assign(out, { vehicleMode: "mine", userVehicleId: wanted.id, generationId: wanted.generation_id, engineId: wanted.engine_id, vehicleText: "" });
  if (phone) {
    const prof = s.profiles.find((p) => p.phone === phone);
    const addr = s.addresses.find((a) => a.owner === phone && a.is_default) ?? s.addresses.find((a) => a.owner === phone);
    if (!out.name && prof?.full_name) out.name = prof.full_name;
    if (!out.area && addr) Object.assign(out, { district: addr.district, area: addr.area });
    const car = s.vehicles.find((v) => v.id === s.activeVehicleId && v.owner === phone) ?? s.vehicles.find((v) => v.owner === phone && v.is_primary);
    if (!out.vehicleMode && car) Object.assign(out, { vehicleMode: "mine", userVehicleId: car.id, generationId: car.generation_id, engineId: car.engine_id });
  } else if (!out.phone) {
    out.phone = getGuestPhone()?.replace(/^\+88/, "") ?? "";
  }
  return out;
};

function Wizard({ mode, q, vehicle }: { mode: string | null; q: string | null; vehicle: string | null }) {
  const { tx, d, lang } = useT();
  const loggedIn = useDb((s) => !!s.session.customerPhone);
  const [draft, setDraft] = useState<Draft>(() => prefill(loadDraft(mode, q), vehicle));
  const [sent, setSent] = useState<PartRequest | null>(null);
  const set = useCallback((patch: Partial<Draft>) => setDraft((x) => ({ ...x, ...patch })), []);

  useEffect(() => {
    if (!sent) saveDraft(draft);
  }, [draft, sent]);

  const steps = [
    { title: tx("কী লাগবে বলুন", "What do you need?"), guide: tx("লাল বাটন চেপে বলুন কোন গাড়ির কী পার্ট লাগবে। চাইলে ছবি দিন বা লিখে দিন।", "Press the red button and say which part you need for which car. You can also send a photo or type.") },
    { title: tx("কোন গাড়ির জন্য?", "For which car?"), guide: tx("আপনার গাড়ি বাছাই করুন। না জানলে 'জানি না' চাপুন, টিম জেনে নেবে।", "Choose your car. If you're not sure, press 'Not sure' and our team will ask.") },
    { title: tx("কেমন মান চান?", "What quality?"), guide: tx("জেনুইন না কম দাম, নতুন না পুরনো, আর কবের মধ্যে লাগবে বেছে নিন।", "Choose genuine or cheapest, new or used, and when you need it.") },
    { title: tx("কোথায় জানাবো?", "Where do we reach you?"), guide: tx("দাম এলে জানানোর জন্য নম্বর আর আপনার এলাকা দিন। দোকান আপনার নম্বর দেখবে না।", "Give your number and area so we can tell you about prices. Shops won't see your number.") },
    { title: tx("দেখে নিয়ে পাঠান", "Check and send"), guide: tx("সব ঠিক থাকলে নিচের বড় সবুজ বাটন চাপুন।", "If everything looks right, press the big green button below.") },
  ];
  const valid = [
    hasWhat(draft),
    draft.vehicleMode === "mine" || draft.vehicleMode === "unknown" || (draft.vehicleMode === "text" && draft.vehicleText.trim().length > 1) || (draft.vehicleMode === "pick" && (!!draft.generationId || !!draft.vehicleText)),
    !!draft.source && !!draft.condition && !!draft.neededBy,
    !contactError(draft, loggedIn, lang),
    true,
  ];
  const step = Math.min(draft.step, 4);
  const goto = (n: number) => {
    set({ step: n });
    window.scrollTo({ top: 0 });
  };

  const send = () => {
    const s = getDb();
    const phone = s.session.customerPhone ?? normalizePhone(draft.phone);
    if (!phone) return goto(3);
    const res = createRequest({
      phone,
      contact_name: draft.name.trim() || null,
      user_vehicle_id: draft.vehicleMode === "mine" ? draft.userVehicleId : null,
      generation_id: draft.generationId,
      engine_id: draft.engineId,
      vehicle_text: draft.vehicleText.trim() || null,
      description_text: draft.text.trim() || null,
      category_id: draft.categoryId,
      voice_notes: draft.voice,
      photos: draft.photos,
      preferred_source: draft.source ?? "you_decide",
      preferred_condition: draft.condition ?? "any",
      needed_by: draft.neededBy ?? "no_rush",
      district: draft.district,
      area: draft.area,
    });
    if ("error" in res) {
      toast(tx("আজকের রিকোয়েস্টের সীমা শেষ। কল করুন।", "Daily request limit reached. Please call us."), "bad");
      return goto(3);
    }
    if (!s.session.customerPhone) setGuestPhone(phone);
    clearDraft();
    setSent(res);
    window.scrollTo({ top: 0 });
  };

  if (sent)
    return (
      <Sent
        r={sent}
        onAnother={() => {
          setSent(null);
          setDraft(prefill(emptyDraft()));
        }}
      />
    );

  return (
    <Container className="space-y-5">
      <div>
        {step === 0 ? (
          <BackButton href="/" />
        ) : (
          <button type="button" onClick={() => goto(step - 1)} className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 font-semibold text-ink-2 hover:bg-ink/5">
            <ArrowLeft className="size-5" aria-hidden /> {tx("আগের ধাপ", "Previous step")}
          </button>
        )}
        <p className="text-sm font-semibold text-muted">
          🙋 {tx("পার্ট চাই", "Request a part")} · {tx(`ধাপ ${d(step + 1)}/${d(5)}`, `Step ${step + 1}/5`)}
        </p>
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {steps.map((_, i) => (
            <span key={i} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`} />
          ))}
        </div>
        <h1 className="mt-3 text-2xl font-bold">{steps[step].title}</h1>
      </div>
      <AudioGuide key={step} text={steps[step].guide} />

      {step === 0 && <StepHow draft={draft} set={set} />}
      {step === 1 && <StepVehicle draft={draft} set={set} />}
      {step === 2 && <StepQuality draft={draft} set={set} />}
      {step === 3 && <StepContact draft={draft} set={set} />}
      {step === 4 && <StepReview draft={draft} goto={goto} />}

      <div className="flex gap-2">
        {step > 0 && (
          <Button variant="outline" size="lg" onClick={() => goto(step - 1)} aria-label={tx("আগের ধাপ", "Previous step")}>
            <ArrowLeft className="size-5" aria-hidden />
          </Button>
        )}
        {step < 4 ? (
          <Button variant="primary" size="lg" full disabled={!valid[step]} onClick={() => goto(step + 1)}>
            {tx("পরের ধাপ", "Next")} <ArrowRight className="size-5" aria-hidden />
          </Button>
        ) : (
          <Button variant="ok" size="xl" full onClick={send} disabled={!valid.every(Boolean)}>
            <Send className="size-6" aria-hidden /> {tx("দোকানে পাঠান", "Send to shops")}
          </Button>
        )}
      </div>
      <p className="text-center text-xs text-muted">💾 {tx("যা দিয়েছেন তা এই ফোনে সেভ থাকছে", "Your answers are saved on this phone")}</p>
      <HelpCall text={tx("বলতে সমস্যা? কল করে রিকোয়েস্ট দিন", "Trouble? Call us to place the request")} />
    </Container>
  );
}

function Sent({ r, onAnother }: { r: PartRequest; onAnother: () => void }) {
  const { tx, d } = useT();
  const msg =
    r.status === "open"
      ? tx(`আপনার রিকোয়েস্ট ${d(r.matches.length)}টা দোকানে পাঠানো হয়েছে। দাম এলেই জানাবো।`, `Your request was sent to ${r.matches.length} shops. We'll tell you as soon as prices come in.`)
      : r.voice_notes.length
        ? tx("আমাদের টিম শুনে দোকানে পাঠাবে। দরকার হলে আপনাকে ফোন করবে।", "Our team will listen and send it to shops. They may call you.")
        : tx("আমাদের টিম দেখে ঠিক দোকানে পাঠাবে। দাম এলেই জানাবো।", "Our team will check it and send it to the right shops. We'll tell you when prices come in.");
  return (
    <Container className="space-y-5">
      <Card className="space-y-4 p-6 text-center">
        <CheckCircle2 className="mx-auto size-20 text-ok" aria-hidden />
        <h1 className="text-2xl font-bold">{tx("রিকোয়েস্ট পাঠানো হয়েছে!", "Request sent!")}</h1>
        <p className="text-lg">{msg}</p>
        <p className="text-muted">
          {tx("রিকোয়েস্ট নম্বর", "Request number")}: <b className="tabular-nums text-ink">{d(r.request_no)}</b>
        </p>
        <SpeakButton text={msg} className="mx-auto" />
      </Card>
      <ButtonLink href={`/request/${r.id}`} variant="ok" size="xl" full>
        {tx("রিকোয়েস্ট দেখুন", "View request")}
      </ButtonLink>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onAnother}>
          {tx("আরেকটা পার্ট চাই", "Another part")}
        </Button>
        <ButtonLink href="/" variant="outline">
          🏠 {tx("হোম", "Home")}
        </ButtonLink>
      </div>
      <HelpCall />
    </Container>
  );
}
