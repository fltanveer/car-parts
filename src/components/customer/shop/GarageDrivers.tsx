"use client";

import { Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { displayPhone, normalizePhone } from "@/lib/format";
import type { UserVehicle } from "@/lib/types";
import { toast } from "@/components/shared/Misc";
import { useT } from "@/components/providers/LangProvider";
import { Button, Field, Input, Toggle } from "@/components/ui/primitives";
import { addDriver, removeDriver, setDriverApproval } from "./actions";

/** Share the car with a driver by phone; owner approves their orders (file 01 3.1). */
export function GarageDrivers({ vehicle }: { vehicle: UserVehicle }) {
  const { tx, d } = useT();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-2">{tx("ড্রাইভার এই গাড়ির পার্টস খুঁজতে ও দাম চাইতে পারবে। অর্ডার দিলে আপনার কাছে 'অনুমোদন দিন' যাবে।", "Drivers can search parts and request prices for this car. Their orders need your approval.")}</p>
      {vehicle.drivers.length > 0 && (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
          {vehicle.drivers.map((dr) => (
            <li key={dr.phone} className="px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-xl" aria-hidden>🧑‍✈️</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{dr.name ?? tx("ড্রাইভার", "Driver")}</span>
                  <span className="block text-sm text-muted">{d(displayPhone(dr.phone))}</span>
                </span>
                <button
                  type="button"
                  aria-label={tx("সরান", "Remove")}
                  onClick={() => {
                    removeDriver(vehicle.id, dr.phone);
                    toast(tx("ড্রাইভার সরানো হয়েছে", "Driver removed"), "info");
                  }}
                  className="grid size-10 place-items-center rounded-lg text-muted hover:bg-bad-soft hover:text-bad"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <Toggle checked={dr.approval_required} onChange={(v) => setDriverApproval(vehicle.id, dr.phone, v)} label={<span className="text-sm">{tx("অর্ডারে আমার অনুমোদন লাগবে", "Orders need my approval")}</span>} />
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={tx("ড্রাইভারের মোবাইল", "Driver's mobile")} error={err}>
          <Input inputMode="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setErr(null); }} placeholder="01XXXXXXXXX" />
        </Field>
        <Field label={tx("নাম (ঐচ্ছিক)", "Name (optional)")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </div>
      <Button
        variant="outline"
        size="lg"
        full
        onClick={() => {
          const p = normalizePhone(phone);
          if (!p) return setErr(tx("সঠিক মোবাইল নম্বর দিন", "Enter a valid mobile number"));
          addDriver(vehicle.id, { phone: p, name: name.trim() || null, approval_required: true });
          toast(tx("ড্রাইভারকে SMS-এ আমন্ত্রণ পাঠানো হয়েছে", "Invite sent to the driver by SMS"));
          setPhone("");
          setName("");
        }}
      >
        <UserPlus className="size-5" aria-hidden /> {tx("ড্রাইভার যোগ করুন", "Add driver")}
      </Button>
    </div>
  );
}
