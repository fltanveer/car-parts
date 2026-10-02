"use client";

// Customer-side helpers built on the shared store's `update()`. Garage edits
// stay on the vehicle record; nothing here moves money or order status.
import { loginCustomer, uid } from "@/lib/db/actions";
import { iso } from "@/lib/db/seed";
import { update } from "@/lib/db/store";
import type { Expense, ServiceLog, UserVehicle, VehicleDocType } from "@/lib/types";

/** loginCustomer() already moves guest cars and addresses to the account. */
export const loginAndClaim = (phone: string) => loginCustomer(phone);

const patchVehicle = (id: string, fn: (v: UserVehicle) => Partial<UserVehicle>) =>
  update((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...fn(v) } : v)) }));

export const setDocExpiry = (vehicleId: string, docType: VehicleDocType, expires_on: string | null, file_url?: string | null) =>
  patchVehicle(vehicleId, (v) => {
    const exists = v.documents.some((d) => d.doc_type === docType);
    const base = { id: uid(), doc_type: docType, expires_on: null, file_url: null, status: "missing" as const };
    const docs = exists ? v.documents : [...v.documents, base];
    return {
      documents: docs.map((d) =>
        d.doc_type === docType
          ? {
              ...d,
              expires_on,
              file_url: file_url === undefined ? d.file_url : file_url,
              // Photo without a date: the team reads the date (status pending_review).
              status: expires_on ? "ok" : file_url ? "pending_review" : d.status,
            }
          : d,
      ),
    };
  });

/** Photo of the paper: team / OCR fills the expiry date (file 01 3.1). */
export const uploadDocPhoto = (vehicleId: string, ownerPhone: string, docType: VehicleDocType, url: string) => {
  patchVehicle(vehicleId, (v) => ({
    documents: v.documents.map((d) => (d.doc_type === docType ? { ...d, file_url: url, status: d.expires_on ? d.status : "pending_review" } : d)),
  }));
  update((s) => ({
    garageTasks: [{ id: uid(), user_phone: ownerPhone, user_vehicle_id: vehicleId, kind: "doc_expiry", doc_type: docType, status: "open", created_at: iso() }, ...s.garageTasks],
  }));
};

export const addServiceLog = (vehicleId: string, log: Omit<ServiceLog, "id">) =>
  patchVehicle(vehicleId, (v) => ({
    service_logs: [{ ...log, id: uid() }, ...v.service_logs],
    odometer_km: log.odometer_km && log.odometer_km > (v.odometer_km ?? 0) ? log.odometer_km : v.odometer_km,
  }));
export const removeServiceLog = (vehicleId: string, logId: string) => patchVehicle(vehicleId, (v) => ({ service_logs: v.service_logs.filter((l) => l.id !== logId) }));

export const addExpense = (vehicleId: string, e: Omit<Expense, "id">) => patchVehicle(vehicleId, (v) => ({ expenses: [{ ...e, id: uid() }, ...v.expenses] }));
export const removeExpense = (vehicleId: string, expenseId: string) => patchVehicle(vehicleId, (v) => ({ expenses: v.expenses.filter((x) => x.id !== expenseId) }));

export const addDriver = (vehicleId: string, d: UserVehicle["drivers"][number]) =>
  patchVehicle(vehicleId, (v) => ({ drivers: [...v.drivers.filter((x) => x.phone !== d.phone), d] }));
export const removeDriver = (vehicleId: string, phone: string) => patchVehicle(vehicleId, (v) => ({ drivers: v.drivers.filter((x) => x.phone !== phone) }));
export const setDriverApproval = (vehicleId: string, phone: string, approval_required: boolean) =>
  patchVehicle(vehicleId, (v) => ({ drivers: v.drivers.map((x) => (x.phone === phone ? { ...x, approval_required } : x)) }));

export const setPrimaryVehicle = (vehicleId: string) =>
  update((s) => {
    const owner = s.vehicles.find((v) => v.id === vehicleId)?.owner;
    return { vehicles: s.vehicles.map((v) => (v.owner === owner ? { ...v, is_primary: v.id === vehicleId } : v)), activeVehicleId: vehicleId };
  });
