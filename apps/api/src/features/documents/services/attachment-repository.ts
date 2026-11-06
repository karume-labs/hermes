import { db } from "@db/client";
import { caseAttachments } from "@db/documents/schema/index";
import type { AttachmentKind, CaseAttachment } from "@hermes/types";
import { asc, eq } from "drizzle-orm";

const toAttachment = (
  row: typeof caseAttachments.$inferSelect,
): CaseAttachment => ({
  id: row.id,
  caseId: row.caseId,
  kind: row.kind,
  filename: row.filename,
  storedName: row.storedName,
  mimeType: row.mimeType,
  sizeBytes: row.sizeBytes,
  uploadedBy: row.uploadedBy,
  createdAt: row.createdAt.toISOString(),
});

export const listAttachments = async (
  caseId: string,
): Promise<CaseAttachment[]> => {
  const rows = await db
    .select()
    .from(caseAttachments)
    .where(eq(caseAttachments.caseId, caseId))
    .orderBy(asc(caseAttachments.createdAt));
  return rows.map(toAttachment);
};

export const findAttachment = async (
  id: string,
): Promise<CaseAttachment | null> => {
  const [row] = await db
    .select()
    .from(caseAttachments)
    .where(eq(caseAttachments.id, id));
  return row === undefined ? null : toAttachment(row);
};

export const insertAttachment = async (input: {
  caseId: string;
  kind: AttachmentKind;
  filename: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
}): Promise<CaseAttachment> => {
  const [row] = await db.insert(caseAttachments).values(input).returning();
  return toAttachment(row);
};
