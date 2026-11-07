import {
  IconArrowsExchange,
  IconBuildingHospital,
  IconCalendarEvent,
  IconChecklist,
  IconHistory,
  IconLayoutDashboard,
  IconRoute,
  IconSend,
  IconStethoscope,
  IconUsers,
  IconWebhook,
} from "@tabler/icons-react";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Queue", href: "/queue", icon: <IconStethoscope size={20} /> },
  {
    label: "Appointments",
    href: "/appointments",
    icon: <IconCalendarEvent size={20} />,
  },
  { label: "Patients", href: "/patients", icon: <IconUsers size={20} /> },
  {
    label: "Referrals",
    href: "/referrals",
    icon: <IconArrowsExchange size={20} />,
  },
  { label: "Tasks", href: "/tasks", icon: <IconChecklist size={20} /> },
  {
    label: "Overview",
    href: "/admin",
    icon: <IconLayoutDashboard size={20} />,
    adminOnly: true,
  },
  {
    label: "Clinics",
    href: "/admin/clinics",
    icon: <IconBuildingHospital size={20} />,
    adminOnly: true,
  },
  {
    label: "Audit trail",
    href: "/admin/audit",
    icon: <IconHistory size={20} />,
    adminOnly: true,
  },
  {
    label: "Delivery",
    href: "/admin/delivery",
    icon: <IconSend size={20} />,
    adminOnly: true,
  },
  {
    label: "Integrations",
    href: "/admin/webhooks",
    icon: <IconWebhook size={20} />,
    adminOnly: true,
  },
  {
    label: "Routing rules",
    href: "/admin/routing",
    icon: <IconRoute size={20} />,
    adminOnly: true,
  },
  {
    label: "Staff access",
    href: "/admin/staff",
    icon: <IconUsers size={20} />,
    adminOnly: true,
  },
];
