"use client";

import type { ReactNode } from "react";
import { AdminPage } from "../AdminPage";
import { ReadOnlyNotice, SettingsNav, useSettingsAccess } from "./SettingsNav";

/** AdminPage + settings tabs + super-admin read-only gate. */
export function SettingsFrame({ title, subtitle, guide, children }: { title: string; subtitle?: string; guide: string; children: (canEdit: boolean) => ReactNode }) {
  const { canEdit } = useSettingsAccess();
  return (
    <AdminPage title={title} subtitle={subtitle} guide={guide}>
      <SettingsNav />
      <ReadOnlyNotice show={!canEdit} />
      {children(canEdit)}
    </AdminPage>
  );
}
