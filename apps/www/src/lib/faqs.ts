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
    question: "I am a patient. How do I get my results on my phone?",
    answer:
      "Download Hermes Care from the App Store or Google Play and sign in with the phone number your clinic has on file. The app sends a one-time code by SMS, so there is no password to create and no account to buy.",
  },
  {
    question: "What does the app cost a patient?",
    answer:
      "Nothing. The app is free to download and to use; there are no in-app purchases or subscriptions. Your clinic decides whether to share results through Hermes, and it can revoke access at any time.",
  },
  {
    question: "What happens when a lab result comes in?",
    answer:
      "Hermes accepts FHIR Observations and HL7 ORU messages on a webhook signed with HMAC-SHA256 and a timestamp, rejecting stale or replayed calls. It maps the marker to a LOINC code, grades it urgent (4 hours), actionable (48 hours) or routine (168 hours), routes it to the owning clinic and pushes the result to the patient in plain language.",
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
      "Staff accounts are created by an administrator invite; there is no public sign-up. Coordinators see only their own clinic's queue, while governance metrics, delivery health and routing configuration are limited to the admin role. Patients sign in with a one-time SMS code, and every patient read is scoped to that patient's own cases.",
  },
  {
    question: "Is this replacing clinical judgment?",
    answer:
      "No. A screening flag is not a diagnosis. Triage orders the work and starts the clock; a clinician still confirms the result, decides the plan and signs the case off with documented evidence.",
  },
];
