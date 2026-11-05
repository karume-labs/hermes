/**
 * Search and share copy plus the JSON-LD graph rendered into every page.
 * These strings live here rather than in constants.ts because they are
 * crawler-facing: changing the hero copy must not silently rewrite what search
 * engines have indexed.
 */
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import type { Faq } from "@/lib/faqs";

export const SITE_TITLE =
  "Hermes - Close the loop between the lab, the clinic and the patient";

export const SITE_DESCRIPTION =
  "Hermes ingests FHIR and HL7 lab results, grades them by clinical severity, gets a patient acknowledgment from the mobile app, and gives clinic teams a queue that closes at sign-off.";

export const SITE_KEYWORDS = [
  "Hermes",
  "care loop",
  "lab result follow-up",
  "closed-loop referrals",
  "FHIR integration",
  "HL7 ORU",
  "clinical triage",
  "SLA tracking",
  "patient engagement",
  "clinic dashboard",
];

export const AUTHOR = "Daniel Karume";
export const LOCALE = "en_KE";
export const OG_IMAGE_ALT =
  "Hermes: an origami wing in slate and sky blue with a white heart";

export interface Breadcrumb {
  name: string;
  item: string;
}

const absolute = (path: string): string => new URL(path, SITE_URL).toString();

const organization = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: absolute("/logo.svg"),
  description: SITE_DESCRIPTION,
};

const softwareApplication = {
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/#app`,
  name: SITE_NAME,
  applicationCategory: "HealthApplication",
  operatingSystem: "Web, Android, iOS",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  publisher: { "@id": `${SITE_URL}/#organization` },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const faqPage = (faq: Faq[]) => ({
  "@type": "FAQPage",
  "@id": `${SITE_URL}/#faq`,
  mainEntity: faq.map((entry) => ({
    "@type": "Question",
    name: entry.question,
    acceptedAnswer: { "@type": "Answer", text: entry.answer },
  })),
});

export const buildStructuredData = ({ faq = [] }: { faq?: Faq[] }) => ({
  "@context": "https://schema.org",
  "@graph": [
    organization,
    softwareApplication,
    ...(faq.length > 0 ? [faqPage(faq)] : []),
  ],
});
