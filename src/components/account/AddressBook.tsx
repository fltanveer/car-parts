"use client";

import { MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { displayPhone } from "@/lib/format";
import { deleteAddress, getState, saveAddress, useStore } from "@/lib/store";
import type { Address } from "@/lib/types";
import { AddressForm } from "../auth/AddressForm";
import { useT } from "../providers/LangProvider";
import { Button, Card, SectionTitle } from "../ui/primitives";

// Spec 7.16: several saved addresses, one default.
export function AddressBook({ defaultPhone }: { defaultPhone?: string }) {
  const { tx, d } = useT();
  const addresses = useStore((s) => s.addresses);
  // null = closed, "new" = adding, Address = editing
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const makeDefault = (a: Address) => saveAddress({ ...a, is_default: true });

  return (
    <section>
      <SectionTitle
        action={
          editing === null && (
            <Button variant="outline" size="sm" onClick={() => setEditing("new")}>
              <Plus className="size-4" aria-hidden /> {tx("নতুন ঠিকানা", "New address")}
            </Button>
          )
        }
      >
        <span className="inline-flex items-center gap-2">
          <MapPin className="size-5" aria-hidden /> {tx("সেভ করা ঠিকানা", "Saved addresses")}
        </span>
      </SectionTitle>

      {editing !== null && (
        <Card className="mb-3 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">{editing === "new" ? tx("নতুন ঠিকানা", "New address") : tx("ঠিকানা বদলান", "Edit address")}</h3>
            <button type="button" aria-label={tx("বন্ধ", "Close")} onClick={() => setEditing(null)} className="-m-1 p-1">
              <X className="size-5" />
            </button>
          </div>
          <AddressForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? null : editing}
            defaultPhone={defaultPhone}
            onSubmit={(a) => {
              // The first address is always the default.
              saveAddress({ ...a, is_default: a.is_default || addresses.length === 0 });
              setEditing(null);
            }}
          />
        </Card>
      )}

      {addresses.length === 0 && editing === null ? (
        <Card className="p-4 text-center text-muted">{tx("কোনো ঠিকানা সেভ করা নেই।", "No saved addresses.")}</Card>
      ) : (
        <ul className="space-y-2">
          {addresses.map((a) => (
            <li key={a.id}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {a.recipient_name}{" "}
                      {a.is_default && (
                        <span className="ml-1 rounded-full bg-q-genuine-soft px-2 py-0.5 text-xs font-semibold text-q-genuine">
                          {tx("ডিফল্ট", "Default")}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted">{d(displayPhone(a.phone))}</p>
                    <p className="mt-1 text-sm">
                      {a.address_line}
                      {a.address_line && ", "}
                      {a.area}, {a.district}
                    </p>
                    {a.landmark && <p className="text-sm text-muted">{a.landmark}</p>}
                  </div>
                </div>
                {confirmDelete === a.id ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-danger/5 p-2">
                    <p className="flex-1 text-sm font-semibold text-danger">{tx("ঠিকানাটা মুছে ফেলবেন?", "Delete this address?")}</p>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>
                      {tx("না", "No")}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        deleteAddress(a.id);
                        const rest = getState().addresses;
                        if (rest.length && !rest.some((x) => x.is_default)) saveAddress({ ...rest[0], is_default: true });
                        setConfirmDelete(null);
                      }}
                    >
                      {tx("হ্যাঁ, মুছুন", "Yes, delete")}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                      <Pencil className="size-4" aria-hidden /> {tx("বদলান", "Edit")}
                    </Button>
                    {!a.is_default && (
                      <Button size="sm" variant="outline" onClick={() => makeDefault(a)}>
                        {tx("ডিফল্ট করুন", "Make default")}
                      </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => setConfirmDelete(a.id)}>
                      <Trash2 className="size-4" aria-hidden /> {tx("মুছুন", "Delete")}
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
