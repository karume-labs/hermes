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

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  description: string;
  adminOnly?: boolean;
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
];

const ADMIN_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: <IconChartHistogram size={20} />,
    description: "Clinic-wide numbers for the current period.",
    adminOnly: true,
  },
  {
    label: "Clinics",
    href: "/admin/clinics",
    icon: <IconBuildingHospital size={20} />,
    description: "Clinics, their status and which staff belong to each.",
    adminOnly: true,
  },
  {
    label: "Staff access",
    href: "/admin/staff",
    icon: <IconShieldCheck size={20} />,
    description: "Invite colleagues and review who can sign in.",
    adminOnly: true,
  },
  {
    label: "Audit trail",
    href: "/admin/audit",
    icon: <IconHistory size={20} />,
    description: "Every clinical and access event, newest first.",
    adminOnly: true,
  },
  {
    label: "Delivery",
    href: "/admin/delivery",
    icon: <IconSend size={20} />,
    description: "Push and SMS outbox, failures and retries.",
    adminOnly: true,
  },
  {
    label: "Integrations",
    href: "/admin/webhooks",
    icon: <IconWebhook size={20} />,
    description: "Lab feed calls and their signature checks.",
    adminOnly: true,
  },
  {
    label: "Routing rules",
    href: "/admin/routing",
    icon: <IconRoute size={20} />,
    description: "Which result goes to which clinic.",
    adminOnly: true,
  },
];

/** Admins get their own work first; the clinical queue sits underneath. */
export const navSections = (isAdmin: boolean): NavSection[] =>
  isAdmin
    ? [
        { title: "Administration", items: ADMIN_ITEMS },
        { title: "Care team", items: CARE_ITEMS },
      ]
    : [{ title: "Care team", items: CARE_ITEMS }];
