import type { StaffRole } from "@hermes/types";
import {
  IconArrowsExchange,
  IconBuildingHospital,
  IconCalendarEvent,
  IconChartHistogram,
  IconChecklist,
  IconHistory,
  IconRoute,
  IconSend,
  IconShieldCheck,
  IconStethoscope,
  IconUsers,
  IconWebhook,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { PREFERENCES_NAV_ITEM } from "./preferences-nav-item";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  description: string;
  /** Neither coordinators nor clinicians ever see this item. */
  governance?: boolean;
  /** Only the platform operator sees this item. */
  platformOnly?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const CARE_ITEMS: NavItem[] = [
  {
    label: "Queue",
    href: "/queue",
    icon: <IconStethoscope size={20} />,
    description: "Results waiting on a person, soonest deadline first.",
  },
  {
    label: "Appointments",
    href: "/appointments",
    icon: <IconCalendarEvent size={20} />,
    description: "The clinic schedule: booked, attended and cancelled visits.",
  },
  {
    label: "Patients",
    href: "/patients",
    icon: <IconUsers size={20} />,
    description: "Everyone registered at your clinic and their open care load.",
  },
  {
    label: "Referrals",
    href: "/referrals",
    icon: <IconArrowsExchange size={20} />,
    description: "Hand-offs into and out of your clinic.",
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: <IconChecklist size={20} />,
    description: "Reminders, reviews and follow-ups that still need a person.",
  },
  PREFERENCES_NAV_ITEM,
];

const ADMIN_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: <IconChartHistogram size={20} />,
    description: "Clinic-wide numbers for the current period.",
    platformOnly: true,
  },
  {
    label: "Organization",
    href: "/admin/organization",
    icon: <IconBuildingHospital size={20} />,
    description: "Your organization, its clinics and its care teams.",
    governance: true,
  },
  {
    label: "Clinics",
    href: "/admin/clinics",
    icon: <IconBuildingHospital size={20} />,
    description: "Every clinic on the platform and which staff belong to it.",
    platformOnly: true,
  },
  {
    label: "Staff access",
    href: "/admin/staff",
    icon: <IconShieldCheck size={20} />,
    description: "Invite colleagues and review who can sign in.",
    governance: true,
  },
  {
    label: "Audit trail",
    href: "/admin/audit",
    icon: <IconHistory size={20} />,
    description: "Every clinical and access event, newest first.",
    platformOnly: true,
  },
  {
    label: "Delivery",
    href: "/admin/delivery",
    icon: <IconSend size={20} />,
    description: "Push, SMS and email outbox, failures and retries.",
    platformOnly: true,
  },
  {
    label: "Integrations",
    href: "/admin/webhooks",
    icon: <IconWebhook size={20} />,
    description: "Lab feed calls and their signature checks.",
    platformOnly: true,
  },
  {
    label: "Routing rules",
    href: "/admin/routing",
    icon: <IconRoute size={20} />,
    description: "Which result goes to which clinic.",
    platformOnly: true,
  },
];

const visibleGovernance = (role: StaffRole): NavItem[] => {
  if (role === "admin") return ADMIN_ITEMS;
  if (role === "org_admin") {
    return ADMIN_ITEMS.filter(
      (item) => item.governance === true && item.platformOnly !== true,
    );
  }
  return [];
};

/** Coordination and clinical roles see care work only. */
export const navSections = (role: StaffRole): NavSection[] => {
  const governance = visibleGovernance(role);
  return governance.length === 0
    ? [{ title: "Care team", items: CARE_ITEMS }]
    : [
        { title: "Administration", items: governance },
        { title: "Care team", items: CARE_ITEMS },
      ];
};
