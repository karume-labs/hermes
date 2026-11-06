import {
  findBookingByCaseId,
  findSlot,
} from "@api/features/booking/services/booking-repository";
import {
  findCase,
  listAudit,
} from "@api/features/care-loop/services/case-repository";
import { listAttachments } from "@api/features/documents/services/attachment-repository";
import { listNotifications } from "@api/features/notify/services/notification-service";
import { listMessages } from "@api/features/patient/services/patient-repository";

// Full case file: everything the coordinator dashboard needs in one request.
export const getCaseDetail = async (id: string) => {
  const careCase = await findCase(id);
  if (careCase === null) return null;
  const appointment = await findBookingByCaseId(careCase.id);
  const slot = appointment === null ? null : await findSlot(appointment.slotId);
  return {
    ...careCase,
    audit: await listAudit(careCase.id),
    messages: await listMessages(careCase.id),
    notifications: await listNotifications(careCase.id),
    appointment,
    slot,
    attachments: await listAttachments(careCase.id),
  };
};
