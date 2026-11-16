// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PreferencesView } from "@/features/staff/components/preferences-view";

export const metadata: Metadata = {
  title: "Preferences",
  description: "Choose how Hermes reaches you.",
};

const SettingsPage = (): ReactNode => <PreferencesView />;

export default SettingsPage;
