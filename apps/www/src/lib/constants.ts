/**
 * Site-wide constants for the Hermes marketing site.
 *
 * `SITE_URL` must stay in sync with the `site` field in astro.config.mjs — Astro
 * feeds that value into canonical and share tags, while this copy is used in
 * visible links and structured data.
 */
export const SITE_URL = "https://hermes.karume.one";

export const SITE_NAME = "Hermes";

export const SITE_TAGLINE = "Screening to sign-off, without the phone calls.";

/**
 * Where the clinic dashboard lives. Override with PUBLIC_DASHBOARD_URL at build
 * time when the dashboard is hosted somewhere other than the local dev server.
 */
export const DASHBOARD_URL =
  import.meta.env.PUBLIC_DASHBOARD_URL ?? "http://localhost:3100";

export const NAV_ITEMS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Platform" },
  { href: "#governance", label: "Governance" },
  { href: "#faq", label: "FAQ" },
] as const;

/** The three triage grades and the SLA the queue holds them to. */
export const SLA_WINDOWS = [
  {
    grade: "Urgent",
    window: "4 hours",
    escalation: "Escalates to the duty clinician, then SMS fallback",
    tone: "urgent",
  },
  {
    grade: "Actionable",
    window: "48 hours",
    escalation: "Escalates to the clinic coordinator at the 48-hour mark",
    tone: "warning",
  },
  {
    grade: "Routine",
    window: "168 hours",
    escalation: "Escalates to the care team after seven days unacknowledged",
    tone: "neutral",
  },
] as const;

export const STEPS = [
  {
    number: "01",
    title: "Ingest",
    copy: "FHIR Observations and HL7 ORU messages land on HMAC-SHA256 signed webhook endpoints with replay protection. Every call is logged with its source, status and payload.",
    meta: "FHIR · HL7 · webhook log",
  },
  {
    number: "02",
    title: "Triage",
    copy: "LOINC-coded markers are graded urgent, actionable or routine, routed to the owning clinic by marker prefix, and given an SLA deadline.",
    meta: "Severity · routing · SLA clock",
  },
  {
    number: "03",
    title: "Engage",
    copy: "The patient gets a push notification with the result in plain language, then SMS fallback if they have not opened it. One tap acknowledges.",
    meta: "Push · SMS fallback · mobile ack",
  },
  {
    number: "04",
    title: "Close",
    copy: "Coordinators book, refer or escalate from the queue and document the closure plan and evidence. Every transition is written to the audit trail.",
    meta: "Booking · referral · sign-off",
  },
] as const;

export const FEATURES = [
  {
    title: "Loop-closure queue",
    copy: "One worklist sorted by SLA due time: severity, status, mobile acknowledgment and the plain-language summary the patient saw.",
  },
  {
    title: "Patient acknowledgment",
    copy: "The mobile app records when a result was opened and acknowledged, so the clinic stops chasing a call it does not need to make.",
  },
  {
    title: "Booking and referrals",
    copy: "Hold a clinic slot, write a 24-hour calendar reminder and refer onward without leaving the case file.",
  },
  {
    title: "Delivery and fallback",
    copy: "An outbox tracks every push, SMS and in-app notice with attempts and failures, so a silent notification is visible before the SLA breaks.",
  },
  {
    title: "Routing rules",
    copy: "Marker prefixes map results to clinics by longest match. Anything unmatched falls back to the default clinic instead of disappearing.",
  },
  {
    title: "Governance metrics",
    copy: "Acknowledgment speed, breach rate, referral conversion, push read rate and retention, computed from the same case data.",
  },
] as const;
