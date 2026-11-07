import * as Calendar from "expo-calendar/legacy";
import { Platform } from "react-native";

export type CalendarSyncResult =
  | { status: "saved"; eventId: string }
  | { status: "denied" }
  | { status: "unavailable" };

interface VisitEventInput {
  title: string;
  startAt: string;
  endAt: string;
  notes: string;
  location: string;
}

const writableCalendarId = async (): Promise<string | null> => {
  if (Platform.OS === "ios") {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar.id;
  }
  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT,
  );
  const writable = calendars.find(
    (calendar) =>
      calendar.allowsModifications &&
      calendar.accessLevel === Calendar.CalendarAccessLevel.OWNER,
  );
  const fallback = calendars.find((calendar) => calendar.allowsModifications);
  const chosen = writable === undefined ? fallback : writable;
  return chosen === undefined ? null : chosen.id;
};

export const addVisitToCalendar = async (
  input: VisitEventInput,
): Promise<CalendarSyncResult> => {
  try {
    const permission = await Calendar.requestCalendarPermissionsAsync();
    if (!permission.granted) return { status: "denied" };
    const calendarId = await writableCalendarId();
    if (calendarId === null) return { status: "unavailable" };
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: input.title,
      startDate: new Date(input.startAt),
      endDate: new Date(input.endAt),
      notes: input.notes,
      location: input.location,
      alarms: [{ relativeOffset: -24 * 60 }],
    });
    return { status: "saved", eventId };
  } catch (error) {
    console.warn("Calendar sync failed", error);
    return { status: "unavailable" };
  }
};
