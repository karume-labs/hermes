import { create } from "zustand";
import type { JourneyStep } from "@/lib/care-store";

interface JourneyState {
  stepsByCase: Record<string, JourneyStep>;
  setStep: (caseId: string, step: JourneyStep) => void;
}

export const useJourneyStore = create<JourneyState>()((set) => ({
  stepsByCase: {},
  setStep: (caseId, step) =>
    set((s) => ({ stepsByCase: { ...s.stepsByCase, [caseId]: step } })),
}));
