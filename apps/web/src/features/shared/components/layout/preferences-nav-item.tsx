import { IconSettings } from "@tabler/icons-react";
import type { NavItem } from "./nav-items";

export const PREFERENCES_NAV_ITEM: NavItem = {
  label: "Preferences",
  href: "/settings",
  icon: <IconSettings size={20} />,
  description: "Choose whether alerts also reach your inbox.",
};
