import { toFeedback } from "@api/features/patient/services/patient-dto";
import { caseFeedback } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { CaseFeedback } from "@hermes/types";
import { eq } from "drizzle-orm";

export const findCaseFeedback = async (
  caseId: string,
): Promise<CaseFeedback | null> => {
  const [row] = await db
    .select()
    .from(caseFeedback)
    .where(eq(caseFeedback.caseId, caseId))
    .limit(1);
  return row === undefined ? null : toFeedback(row);
};

// A patient may revise their teach-back answer; the latest response wins.
export const saveCaseFeedback = async (input: {
  caseId: string;
  patientId: string;
  understood: boolean;
  confidence: number;
  comment?: string;
}): Promise<CaseFeedback> => {
  const [row] = await db
    .insert(caseFeedback)
    .values({
      caseId: input.caseId,
      patientId: input.patientId,
      understood: input.understood,
      confidence: input.confidence,
      comment: input.comment,
    })
    .onConflictDoUpdate({
      target: caseFeedback.caseId,
      set: {
        understood: input.understood,
        confidence: input.confidence,
        comment: input.comment,
        createdAt: new Date(),
      },
    })
    .returning();
  return toFeedback(row);
};
