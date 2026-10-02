"use client";

import { describeVehicle } from "@/lib/db/queries";
import type { DB } from "@/lib/db/seed";
import { useDb } from "@/lib/db/store";
import { useT } from "@/components/providers/LangProvider";
import { activeVehicleOf, homeDistrict, myProfile } from "./data";

const phoneOf = (s: DB) => s.session.customerPhone;

/** The car everything is filtered for ("my car"). */
export function useMyCar() {
  const vehicle = useDb(activeVehicleOf);
  const { lang, tx } = useT();
  const desc = vehicle ? describeVehicle(vehicle.generation_id, vehicle.engine_id, lang) : null;
  const label = desc?.withYear ?? vehicle?.nickname ?? (vehicle ? tx("আমার গাড়ি (টিম সেট করছে)", "My car (team is setting it up)") : null);
  return { vehicle, desc, generationId: vehicle?.generation_id ?? null, label };
}

export function useMe() {
  const phone = useDb(phoneOf);
  const profile = useDb(myProfile);
  const district = useDb(homeDistrict);
  return { phone, profile, loggedIn: !!phone, district };
}
