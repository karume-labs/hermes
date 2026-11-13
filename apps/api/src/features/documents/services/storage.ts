import { randomUUID } from "node:crypto";
import {
  readLocal,
  writeLocal,
} from "@api/features/documents/services/local-storage";
import { readS3, writeS3 } from "@api/features/documents/services/s3-storage";
import { assertUploadable } from "@api/features/documents/services/upload-validation";
import { env } from "@api/features/shared/env/index";

export {
  ensureUploadsDirectory,
  uploadsDirectory,
} from "@api/features/documents/services/local-storage";
export {
  contentMatches,
  MAX_UPLOAD_BYTES,
} from "@api/features/documents/services/upload-validation";

export const storeUpload = async (
  file: File,
): Promise<{ storedName: string; sizeBytes: number }> => {
  const extension = await assertUploadable(file);
  const storedName = `${randomUUID()}${extension}`;
  if (env.STORAGE_DRIVER === "s3") {
    await writeS3(storedName, file);
  } else {
    await writeLocal(storedName, file);
  }
  return { storedName, sizeBytes: file.size };
};

/**
 * Streams a stored attachment back with the response headers the caller
 * decided on, so the same route works for a single-node disk deploy and for a
 * bucket shared by several replicas.
 */
export const readUpload = async (
  storedName: string,
  headers: Record<string, string>,
): Promise<Response> => {
  if (env.STORAGE_DRIVER === "s3") {
    const bytes = await readS3(storedName);
    return new Response(bytes, { headers });
  }
  return new Response(readLocal(storedName), { headers });
};
