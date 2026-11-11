import type { NotificationKind } from "@hermes/types";
import {
  type Bell,
  CalendarClock,
  MessageSquare,
  ShieldAlert,
} from "lucide-react-native";
import type { PatientNotification } from "@/lib/api/types";

export const KIND_LABEL: Record<NotificationKind, string> = {
  case_alert: "Result alert",
  sms_fallback: "SMS fallback",
  escalation: "Care team follow-up",
  secure_message: "Secure message",
  visit_reminder: "Visit reminder",
  staff_alert: "Care team alert",
};

export const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  case_alert: ShieldAlert,
  sms_fallback: MessageSquare,
  escalation: ShieldAlert,
  secure_message: MessageSquare,
  visit_reminder: CalendarClock,
  staff_alert: ShieldAlert,
};

export const timeLabel = (iso: string): string =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

export const dayLabel = (iso: string): string => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
};

export interface NotificationGroup {
  label: string;
  items: PatientNotification[];
}

export const groupByDay = (items: PatientNotification[]): NotificationGroup[] =>
  items.reduce<NotificationGroup[]>((groups, item) => {
    const label = dayLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last === undefined || last.label !== label) {
      groups.push({ label, items: [item] });
      return groups;
    }
    last.items.push(item);
    return groups;
  }, []);
