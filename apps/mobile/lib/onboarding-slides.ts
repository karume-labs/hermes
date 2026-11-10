import {
  CalendarDays,
  HeartPulse,
  type LucideIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";

export type SlideKind = "welcome" | "feature" | "permission" | "finish";

export interface OnboardingSlide {
  id: string;
  kind: SlideKind;
  title: string;
  body: string;
  icon: LucideIcon;
}

/**
 * The intro, in the order a new patient meets the app: what it is, what it
 * does with a result, how a visit is booked, who can see it, and the one
 * permission that changes what arrives on the phone. Copy stays in the
 * patient's words — no "care orchestration", no "seamless".
 */
export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "welcome",
    kind: "welcome",
    title: "Welcome to Hermes Care",
    body: "Your clinic sends screening results here, written the way a person would say them. Open the app and you will know what the number means and what happens next.",
    icon: HeartPulse,
  },
  {
    id: "results",
    kind: "feature",
    title: "Know what your result means",
    body: "No lab shorthand. You get the marker, the value in plain words, and whether a clinician will call you, you should book a visit, or it can wait until next time.",
    icon: Sparkles,
  },
  {
    id: "visits",
    kind: "feature",
    title: "Book without calling",
    body: "Pick a slot that suits you, move it if plans change, and get a reminder the day before. Your clinic sees the booking straight away.",
    icon: CalendarDays,
  },
  {
    id: "privacy",
    kind: "feature",
    title: "Only you and your care team",
    body: "You sign in with a one-time code sent to the phone number your clinic already has. Results are shared with your care team and never used for marketing.",
    icon: ShieldCheck,
  },
  {
    id: "alerts",
    kind: "permission",
    title: "Turn on result alerts",
    body: "A push arrives the moment a new result is ready, so nothing waits until you next open the app. You can turn this off again in Profile.",
    icon: HeartPulse,
  },
  {
    id: "ready",
    kind: "finish",
    title: "You're all set",
    body: "Your care loop shows every result, booking and message in one place. Anything new appears at the top.",
    icon: Sparkles,
  },
];
