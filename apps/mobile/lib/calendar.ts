import * as Calendar from "expo-calendar/legacy";
import { Platform } from "react-native";
import { deleteKey, readKey, writeKey } from "@/lib/key-store";

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

interface VisitSyncInput extends VisitEventInput {
  /** Keyed by case: a reschedule replaces the booking row with a new id. */
  caseId?: string;
}

// SecureStore only accepts alphanumerics, ".", "-" and "_".
const eventKey = (caseId: string): string =>
  `calendar-event-${caseId.replace(/[^A-Za-z0-9._-]/g, "_")}`;

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

/**
 * Every booking wrote its own event, so a reschedule left the patient with two
 * visits in their calendar. The event id is kept per booking and replaced.
 */
const forgetEvent = async (caseId: string | undefined): Promise<void> => {
  if (caseId === undefined) return;
  const eventId = await readKey(eventKey(caseId));
  if (eventId === null) return;
  try {
    await Calendar.deleteEventAsync(eventId);
  } catch (error) {
    console.warn("Calendar event cleanup failed", error);
  }
  await deleteKey(eventKey(caseId));
};

export const syncVisitToCalendar = async (
  input: VisitSyncInput,
): Promise<CalendarSyncResult> => {
  try {
    const permission = await Calendar.requestCalendarPermissionsAsync();
    if (!permission.granted) return { status: "denied" };
    const calendarId = await writableCalendarId();
    if (calendarId === null) return { status: "unavailable" };
    await forgetEvent(input.caseId);
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: input.title,
      startDate: new Date(input.startAt),
      endDate: new Date(input.endAt),
      notes: input.notes,
      location: input.location,
      alarms: [{ relativeOffset: -24 * 60 }],
    });
    if (input.caseId !== undefined) {
      await writeKey(eventKey(input.caseId), eventId);
    }
    return { status: "saved", eventId };
  } catch (error) {
    console.warn("Calendar sync failed", error);
    return { status: "unavailable" };
  }
};

/** A cancelled visit should not keep a slot in the patient's week. */
export const removeVisitFromCalendar = (caseId: string): Promise<void> =>
  forgetEvent(caseId);
