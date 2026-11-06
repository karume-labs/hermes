import {
  findCase,
  logAudit,
} from "@api/features/care-loop/services/case-repository";
import {
  findAttachment,
  insertAttachment,
  listAttachments,
} from "@api/features/documents/services/attachment-repository";
import {
  readUpload,
  storeUpload,
} from "@api/features/documents/services/storage";
import {
  assertCoordinator,
  requireStaff,
} from "@api/features/shared/auth/index";
import {
  NotFoundError,
  UnauthorizedError,
} from "@api/features/shared/errors/index";
import type { AttachmentKind } from "@hermes/types";
import { Elysia, t } from "elysia";

const KINDS = [
  "lab_report",
  "referral_letter",
  "closure_evidence",
  "other",
] as const;

const isKind = (value: string): value is AttachmentKind =>
  (KINDS as readonly string[]).includes(value);

const authHeader = t.Object({
  authorization: t.Optional(t.String()),
  cookie: t.Optional(t.String()),
});

const UploadBody = t.Object({
  file: t.File({ maxSize: "10m" }),
  kind: t.Optional(t.String()),
});

// Sign-in wraps the file upload in a FormData body; Elysia parses it into a
// File and the storage service writes it to the API server's own disk.
export const caseAttachmentsRouter = new Elysia({ prefix: "/cases" })
  .post(
    "/:id/attachments",
    async ({ params, body, headers }) => {
      const staff = await requireStaff(headers);
      const found = await findCase(params.id);
      if (found === null) throw new NotFoundError("Case not found");

      const stored = await storeUpload(body.file);
      const attachment = await insertAttachment({
        caseId: found.id,
        kind:
          body.kind !== undefined && isKind(body.kind) ? body.kind : "other",
        filename: body.file.name,
        storedName: stored.storedName,
        mimeType: body.file.type,
        sizeBytes: stored.sizeBytes,
        uploadedBy: staff.email,
      });
      await logAudit(found.id, `staff:${staff.email}`, "attachment_uploaded", {
        attachmentId: attachment.id,
        filename: attachment.filename,
        kind: attachment.kind,
      });
      return attachment;
    },
    { body: UploadBody, headers: authHeader },
  )
  .get("/:id/attachments", async ({ params, headers }) => {
    await assertCoordinator(headers);
    const found = await findCase(params.id);
    if (found === null) throw new NotFoundError("Case not found");
    return listAttachments(found.id);
  });

// Download: staff read any file; the mobile app passes the patient id it is
// already scoped by, and the case must belong to that patient.
export const attachmentDownloadRouter = new Elysia({
  prefix: "/attachments",
}).get(
  "/:id",
  async ({ params, query, headers, set }) => {
    const attachment = await findAttachment(params.id);
    if (attachment === null) throw new NotFoundError("File not found");
    const careCase = await findCase(attachment.caseId);
    if (careCase === null) throw new NotFoundError("File not found");

    if (query.patientId === undefined) {
      await assertCoordinator(headers);
    } else if (query.patientId !== careCase.patientId) {
      throw new UnauthorizedError("Not permitted");
    }

    set.headers["content-type"] = attachment.mimeType;
    set.headers["content-disposition"] =
      `inline; filename="${attachment.filename.replace(/"/g, "")}"`;
    set.headers["cache-control"] = "private, no-store";
    return readUpload(attachment.storedName);
  },
  {
    query: t.Object({ patientId: t.Optional(t.String()) }),
    headers: authHeader,
  },
);
