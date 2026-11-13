export { appUrl } from "@api/features/shared/mail/app-url";
export {
  buildEmailHtml,
  escapeHtml,
} from "@api/features/shared/mail/email-template";
export {
  createMailTransport,
  isMailConfigured,
  verifyMail,
} from "@api/features/shared/mail/mail-transport";
export {
  sendPatientAlertEmail,
  sendPatientCodeEmail,
  sendPatientResultEmail,
  sendVisitReminderEmail,
} from "@api/features/shared/mail/patient-mail";
export {
  type MailKind,
  type MailResult,
  sendMail,
  wantsEmail,
} from "@api/features/shared/mail/send-mail";
export {
  sendPasswordResetEmail,
  sendStaffAlertEmail,
  sendStaffInviteEmail,
} from "@api/features/shared/mail/staff-mail";
