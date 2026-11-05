export interface Faq {
  question: string;
  answer: string;
}

/**
 * Answers written to be checkable against the codebase, not aspirational.
 * The same array feeds the visible FAQ and the FAQPage JSON-LD, so the rich
 * result and the page copy cannot drift apart.
 */
export const FAQS: Faq[] = [
  {
    question: "What happens when a lab result comes in?",
    answer:
      "Hermes accepts FHIR Observations and HL7 ORU messages on a webhook, maps the marker to a LOINC code and grades it urgent, actionable or routine. The result is routed to the owning clinic, given an SLA deadline and pushed to the patient in plain language.",
  },
  {
    question: "How does the clinic know a patient saw the result?",
    answer:
      "The patient app records every open and acknowledgment against the case. If the notification is not acknowledged before the SLA window closes, the case is escalated rather than left waiting, and the queue shows the pending acknowledgment next to the case.",
  },
  {
    question: "Which results does the triage grade?",
    answer:
      "Glucose, HbA1c, LDL and HDL cholesterol, potassium, sodium and cardiac markers, plus any feed that arrives with LOINC codes. Numeric OBX segments in HL7 and coded observations in FHIR both carry through with their original values and units.",
  },
  {
    question: "Can notifications fail silently?",
    answer:
      "No. Every push, SMS and in-app notice is written to an outbox with its attempts, status and the error that stopped it. Delivery health and the webhook log sit beside the governance metrics, so a failed notification is visible before it becomes a breach.",
  },
  {
    question: "Who can see a case?",
    answer:
      "Staff sign in with Better Auth, either email and password or Google. Coordinators see the queue and the cases they work; governance metrics, delivery health and routing configuration are limited to the admin role. Patient access in the mobile app is scoped to that patient's own cases.",
  },
  {
    question: "Is this replacing clinical judgment?",
    answer:
      "No. A screening flag is not a diagnosis. Triage orders the work and starts the clock; a clinician still confirms the result, decides the plan and signs the case off with documented evidence.",
  },
];
