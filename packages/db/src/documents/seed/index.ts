import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { caseAttachments } from "@db/documents/schema/index";
import { buildPdf } from "@db/documents/seed/pdf";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { inArray } from "drizzle-orm";
import data from "./data.json";

const AttachmentSeed = Type.Object({
  slug: Type.String(),
  kind: Type.Union([
    Type.Literal("lab_report"),
    Type.Literal("referral_letter"),
    Type.Literal("closure_evidence"),
    Type.Literal("other"),
  ]),
  filename: Type.String(),
  uploadedBy: Type.String(),
  hoursAfterCase: Type.Number(),
  lines: Type.Array(Type.String()),
});

const fixtures = Value.Parse(Type.Array(AttachmentSeed), data.attachments);

// packages/db/src/documents/seed → repo root, matching the API's default
// UPLOAD_DIR (apps/api is the API's working directory).
const uploadsDirectory = (): string =>
  resolve(import.meta.dirname, "../../../../..", "apps/api/uploads");

export const seedDocuments = async (): Promise<number> => {
  const existing = await db
    .select({ id: caseAttachments.id })
    .from(caseAttachments)
    .limit(1);
  if (existing.length > 0) return 0;

  const cases = await db
    .select({
      id: careCases.id,
      labPayloadId: careCases.labPayloadId,
      createdAt: careCases.createdAt,
    })
    .from(careCases)
    .where(
      inArray(
        careCases.labPayloadId,
        fixtures.map((fixture) => `seed-${fixture.slug}`),
      ),
    );
  if (cases.length === 0) return 0;
  const caseBySlug = new Map(
    cases.map((row) => [row.labPayloadId.replace(/^seed-/, ""), row]),
  );

  const directory = uploadsDirectory();
  await mkdir(directory, { recursive: true });

  let created = 0;
  for (const fixture of fixtures) {
    const careCase = caseBySlug.get(fixture.slug);
    if (careCase === undefined) continue;

    const storedName = `seed-${fixture.slug}.pdf`;
    const bytes = buildPdf(
      fixture.filename.replace(/\.pdf$/, ""),
      fixture.lines,
    );
    await writeFile(join(directory, storedName), bytes);

    await db.insert(caseAttachments).values({
      caseId: careCase.id,
      kind: fixture.kind,
      filename: fixture.filename,
      storedName,
      mimeType: "application/pdf",
      sizeBytes: bytes.byteLength,
      uploadedBy: fixture.uploadedBy,
      createdAt: new Date(
        careCase.createdAt.getTime() + fixture.hoursAfterCase * 3600 * 1000,
      ),
    });
    created += 1;
  }

  return created;
};
