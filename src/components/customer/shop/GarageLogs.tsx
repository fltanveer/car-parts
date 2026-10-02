"use client";

import { Mic, Plus, Trash2, Wrench } from "lucide-react";
import { useState } from "react";
import { useDb } from "@/lib/db/store";
import { expenseLabel } from "@/lib/labels";
import type { ExpenseCategory, UserVehicle } from "@/lib/types";
import { toast, useNow } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, Chip, Field, Input, Notice } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { addExpense, addServiceLog, removeExpense, removeServiceLog } from "./actions";
import { parseSpokenAmount, spokenExpenseCategory, useDictation } from "./useDictation";

// Typical oil-change interval for the reminder (a maintenance hint, not a platform business rule).
const OIL_CHANGE_KM = 5000;
const SERVICE_TYPES = ["অয়েল চেঞ্জ", "ব্রেক", "টায়ার", "ব্যাটারি", "এসি", "সাধারণ সার্ভিস", "অন্য"];
const today = () => new Date().toISOString();

/** Service history incl. parts bought in the app, and next oil-change hint (file 01 3.1). */
export function ServiceLogSection({ vehicle }: { vehicle: UserVehicle }) {
  const { tx, taka, d, date } = useT();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(SERVICE_TYPES[0]);
  const [km, setKm] = useState(vehicle.odometer_km ? String(vehicle.odometer_km) : "");
  const [cost, setCost] = useState("");
  const [garage, setGarage] = useState("");
  // Parts bought in the app for this car are added automatically.
  const appParts = useDb((s) =>
    s.orders
      .filter((o) => o.user_vehicle_id === vehicle.id)
      .flatMap((o) => s.vendorOrders.filter((v) => v.order_id === o.id && ["delivered", "completed"].includes(v.status)).map((v) => ({ o, v }))),
  );
  const lastOil = vehicle.service_logs.find((l) => /অয়েল|oil/i.test(l.type) && l.odometer_km);
  const nextOilKm = lastOil?.odometer_km ? lastOil.odometer_km + OIL_CHANGE_KM : null;
  const left = nextOilKm && vehicle.odometer_km ? nextOilKm - vehicle.odometer_km : null;

  return (
    <div className="space-y-3">
      {lastOil ? (
        <Notice tone={left !== null && left <= 500 ? "wait" : "ok"}>
          🛢️ {tx(`শেষ অয়েল চেঞ্জ ${date(lastOil.date)}, ${d(lastOil.odometer_km!.toLocaleString("en-IN"))} কিমিতে।`, `Last oil change ${date(lastOil.date)} at ${lastOil.odometer_km!.toLocaleString("en-IN")} km.`)}{" "}
          {left !== null && (left > 0 ? tx(`পরের অয়েল চেঞ্জ ~${d(left.toLocaleString("en-IN"))} কিমি পর।`, `Next oil change in ~${left.toLocaleString("en-IN")} km.`) : tx("অয়েল চেঞ্জের সময় হয়ে গেছে!", "Oil change is due!"))}
        </Notice>
      ) : (
        <Notice>{tx("অয়েল চেঞ্জ লিখে রাখুন, পরেরটা কবে মনে করিয়ে দেবো।", "Log an oil change and we'll remind you of the next one.")}</Notice>
      )}
      <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
        {appParts.map(({ o, v }) => (
          <li key={v.id} className="flex items-start gap-3 px-4 py-3">
            <span aria-hidden>📦</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{v.items.map((i) => i.snapshot.title).join(", ")}</p>
              <p className="text-sm text-muted">{date(v.delivered_at ?? o.created_at)} · {tx("অ্যাপে কেনা", "Bought in app")} · {o.order_no}</p>
            </div>
            <span className="font-semibold">{taka(v.subtotal)}</span>
          </li>
        ))}
        {vehicle.service_logs.map((l) => (
          <li key={l.id} className="flex items-start gap-3 px-4 py-3">
            <Wrench className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{l.type}</p>
              <p className="text-sm text-muted">
                {date(l.date)}
                {l.odometer_km ? ` · ${d(l.odometer_km.toLocaleString("en-IN"))} ${tx("কিমি", "km")}` : ""}
                {l.garage_name ? ` · ${l.garage_name}` : ""}
                {l.order_no ? ` · ${l.order_no}` : ""}
              </p>
            </div>
            <span className="font-semibold">{taka(l.cost)}</span>
            <button type="button" aria-label={tx("মুছুন", "Delete")} onClick={() => removeServiceLog(vehicle.id, l.id)} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-bad-soft hover:text-bad">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
        {!appParts.length && !vehicle.service_logs.length && <li className="px-4 py-6 text-center text-muted">{tx("এখনো কিছু লেখা নেই", "Nothing logged yet")}</li>}
      </ul>
      <Button variant="outline" size="lg" full onClick={() => setOpen(true)}>
        <Plus className="size-5" aria-hidden /> {tx("সার্ভিস যোগ করুন", "Add service")}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={tx("সার্ভিস যোগ", "Add service")}>
        <div className="space-y-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.map((t) => (
              <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={tx("মিটারে কত কিমি", "Odometer km")}><Input inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))} /></Field>
            <Field label={tx("খরচ (৳)", "Cost (৳)")}><Input inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value.replace(/\D/g, ""))} /></Field>
          </div>
          <Field label={tx("গ্যারেজ (ঐচ্ছিক)", "Garage (optional)")}><Input value={garage} onChange={(e) => setGarage(e.target.value)} /></Field>
          <Button
            variant="brand"
            size="lg"
            full
            onClick={() => {
              addServiceLog(vehicle.id, { date: today(), odometer_km: km ? Number(km) : null, type, cost: Number(cost) || 0, garage_name: garage.trim() || null, order_no: null });
              if (Number(cost)) addExpense(vehicle.id, { date: today(), category: "service", amount: Number(cost), note: type });
              toast(tx("যোগ হয়েছে", "Added"));
              setOpen(false);
              setCost("");
              setGarage("");
            }}
          >
            {tx("যোগ করুন", "Add")}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

/** Monthly expenses with one-tap add, 🎤 optional ("আজকে তেল দিলাম দুই হাজার টাকা"). */
export function ExpensesSection({ vehicle }: { vehicle: UserVehicle }) {
  const { tx, L, taka, lang, date } = useT();
  const now = useNow();
  const [cat, setCat] = useState<ExpenseCategory>("fuel");
  const [amount, setAmount] = useState("");
  const [heard, setHeard] = useState<string | null>(null);
  const dict = useDictation((t) => {
    setHeard(t);
    const n = parseSpokenAmount(t);
    const c = spokenExpenseCategory(t);
    if (n) setAmount(String(n));
    if (c) setCat(c);
  }, lang);

  const month = new Date(now);
  const thisMonth = vehicle.expenses.filter((e) => {
    const x = new Date(e.date);
    return x.getMonth() === month.getMonth() && x.getFullYear() === month.getFullYear();
  });
  const total = thisMonth.reduce((t, e) => t + e.amount, 0);
  const byCat = (Object.keys(expenseLabel) as ExpenseCategory[]).map((c) => ({ c, sum: thisMonth.filter((e) => e.category === c).reduce((t, e) => t + e.amount, 0) })).filter((x) => x.sum > 0);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-card p-4">
        <p className="text-sm text-muted">{tx("এই মাসে মোট খরচ", "Spent this month")}</p>
        <p className="text-3xl font-bold">{taka(total)}</p>
        <ul className="mt-3 space-y-2">
          {byCat.map(({ c, sum }) => (
            <li key={c}>
              <div className="flex justify-between text-sm">
                <span>{expenseLabel[c].icon} {L(expenseLabel[c])}</span>
                <span className="font-semibold">{taka(sum)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-surface" aria-hidden>
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(4, (sum / total) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 rounded-2xl border-2 border-brand/30 bg-card p-4">
        <p className="font-bold">{tx("খরচ যোগ করুন", "Add an expense")}</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(expenseLabel) as ExpenseCategory[]).map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{expenseLabel[c].icon} {L(expenseLabel[c])}</Chip>
          ))}
        </div>
        <div className="flex gap-2">
          <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder={tx("কত টাকা", "Amount")} aria-label={tx("কত টাকা", "Amount")} className="text-lg font-bold" />
          {dict.supported && (
            <button type="button" onClick={() => (dict.listening ? dict.stop() : dict.start())} aria-label={tx("বলে লিখুন", "Speak it")} className={`grid size-12 shrink-0 place-items-center rounded-xl bg-bad text-white ${dict.listening ? "recording-pulse" : ""}`}>
              <Mic className="size-6" aria-hidden />
            </button>
          )}
        </div>
        {heard && <p className="text-sm text-muted">🎤 “{heard}”</p>}
        <Button
          variant="brand"
          size="lg"
          full
          disabled={!Number(amount)}
          onClick={() => {
            addExpense(vehicle.id, { date: today(), category: cat, amount: Number(amount), note: heard });
            toast(tx("খরচ যোগ হয়েছে", "Expense added"));
            setAmount("");
            setHeard(null);
          }}
        >
          <Plus className="size-5" aria-hidden /> {tx("যোগ করুন", "Add")}
        </Button>
      </div>

      {vehicle.expenses.length > 0 && (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
          {vehicle.expenses.slice(0, 8).map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
              <span aria-hidden>{expenseLabel[e.category].icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{L(expenseLabel[e.category])}{e.note ? ` · ${e.note}` : ""}</span>
                <span className="block text-xs text-muted">{date(e.date)}</span>
              </span>
              <span className="font-semibold">{taka(e.amount)}</span>
              <button type="button" aria-label={tx("মুছুন", "Delete")} onClick={() => removeExpense(vehicle.id, e.id)} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-bad-soft hover:text-bad">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
