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
 * The hero speaks to both readers at once: the patient holding the phone and
 * the coordinator working the queue. The tagline above stays clinic-facing
 * because it is also the page title and share card.
 */
export const HERO_HEADLINE =
  "Results people understand. Follow-up clinics can prove.";

/**
 * Where the clinic dashboard lives. Override with PUBLIC_DASHBOARD_URL at build
 * time when the dashboard is hosted somewhere other than the local dev server.
 */
export const DASHBOARD_URL =
  import.meta.env.PUBLIC_DASHBOARD_URL ?? "http://localhost:3100";

/**
 * App downloads. The Android link uses the package from apps/mobile/app.json,
 * so it resolves as soon as the listing is live. The App Store link searches
 * while there is no listing id — swap it for the numeric `/app/id…` URL at
 * release rather than guessing an id that points at the wrong app.
 */
export const APP_LINKS = {
  android: "https://play.google.com/store/apps/details?id=com.hermes.care",
  ios: "https://apps.apple.com/search?term=hermes+care",
} as const;

export const NAV_ITEMS = [
  { href: "#patients", label: "For patients" },
  { href: "#how-it-works", label: "For clinics" },
  { href: "#features", label: "Platform" },
  { href: "#governance", label: "Governance" },
  { href: "#faq", label: "FAQ" },
] as const;

/** What the patient app does for the person holding the phone. */
export const PATIENT_STEPS = [
  {
    title: "Your result, in your words",
    copy: "No lab shorthand. Hermes says what the number is, what it means for you, and whether a clinician will call, you should book, or it can wait for your next visit.",
  },
  {
    title: "Say you have seen it",
    copy: "One tap tells your clinic you have read the result. That is the call you no longer have to make — and the reason nobody keeps ringing you.",
  },
  {
    title: "Book without calling",
    copy: "Pick a slot from the app and get a reminder the day before. Reschedule or cancel from the same screen if plans change.",
  },
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
